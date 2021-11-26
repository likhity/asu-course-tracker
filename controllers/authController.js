const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require("dotenv").config();

// handle errors
const handleErrors = (err) => {
  let errors = { email: "", password: "" };

  // incorrect email or password login
  if (err.message === "Either your password or email is incorrect") {
    return err.message;
  }

  if (err.message === "Passwords do not match") {
    errors.password = err.message;
  }

  // duplicate error code
  if (err.code === 11000) {
    errors.email = "That email is already registered";
    return errors;
  }

  // validation errors
  if (err.message.includes("user validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
};

// 3 days of time in seconds
const maxAge = 3 * 24 * 60 * 60;

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: maxAge });
};

module.exports.signup_get = (req, res) => {
  if (res.locals.userEmail) {
    res.redirect("/");
    return;
  }
  res.render("signup");
};

module.exports.login_get = (req, res) => {
  if (res.locals.userEmail) {
    res.redirect("/");
    return;
  }
  res.render("login");
};

module.exports.signup_post = async (req, res) => {
  const { email, password, confirm, phoneNumber } = req.body;

  try {
    if (password !== confirm) {
      throw { message: "Passwords do not match" };
    }
    const user = await User.create({ email, password, phoneNumber });
    const token = createToken(user._id);
    res.cookie("jwt", token, { maxAge: maxAge * 1000, httpOnly: true });
    res.status(201).send({ user: user._id });
  } catch (err) {
    // res.status(500).json({
    //   message: err.message,
    // });
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie("jwt", token, { maxAge: maxAge * 1000, httpOnly: true });
    res.status(200).json({ user: user._id });
  } catch (err) {
    const error = handleErrors(err);
    res.status(400).json({ error });
  }
};

module.exports.logout_get = async (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.redirect("/");
};

module.exports.account_get = (req, res) => {
  res.render("account");
};

module.exports.edit_account_get = (req, res) => {
  res.render("edit-account");
};

module.exports.edit_phone_put = async (req, res) => {
  const { phoneNumber: newNumber } = req.body;

  try {
    await User.updateOne(
      { email: res.locals.userEmail },
      { phoneNumber: newNumber }
    );
    res.status(200).json({
      phone: newNumber,
      message: "Phone number successfully changed.",
    });
  } catch (err) {
    res.status(500).json({
      errors:
        "There was an internal server error when processing your request (code 500).",
    });
  }
};

module.exports.change_password_put = async (req, res) => {
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  try {
    if (newPassword.length < 6) {
      throw "Password must have minimum length of 6 characters";
    }
    if (newPassword !== confirmNewPassword) {
      throw "Passwords do not match";
    }
    const { email, password } = await User.findOne({
      email: res.locals.userEmail,
    });
    const auth = await bcrypt.compare(oldPassword, password);
    if (!auth) {
      throw `Your current password does not match what you entered for "Old Password".`;
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await User.updateOne(
      { email: res.locals.userEmail },
      { password: hashedPassword }
    );
    res.status(200).json({ message: "Password successfully changed." });
  } catch (err) {
    if (
      err === "Passwords do not match" ||
      err ===
        `Your current password does not match what you entered for "Old Password".` ||
      err === "Password must have minimum length of 6 characters"
    ) {
      res.status(400).json({ error: err });
    } else {
      console.log(err);
      res.status(500).json({
        error:
          "There was an internal server error when processing your request (code 500).",
      });
    }
  }
};

module.exports.delete_account_get = (req, res) => {
  res.render("delete-account");
};

module.exports.delete_account_delete = async (req, res) => {
  const { enteredPassword } = req.body;

  try {
    const { email, password: storedPassword } = await User.findOne({
      email: res.locals.userEmail,
    });
    const auth = await bcrypt.compare(enteredPassword, storedPassword);

    if (auth) {
      await User.deleteOne({ email });
    } else {
      res.status(400).json({ error: "Incorrect password." });
    }
    res.cookie("jwt", "", { maxAge: 1 });
    res.status(200).json({});
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error:
        "There was an internal server error when processing your request (code 500).",
    });
  }
};
