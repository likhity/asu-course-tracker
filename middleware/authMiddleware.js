const jwt = require("jsonwebtoken");
const User = require("../models/User");
require("dotenv").config();

const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  // check that jwt exists and is verified
  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect("/login");
      } else {
        const user = await User.findById(decodedToken.id);
        res.locals.userEmail = user.email;
        res.locals.username = user.email.substring(0, user.email.indexOf("@"));
        next();
      }
    });
  } else {
    res.redirect("/signup");
  }
};

const checkUser = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    await jwt.verify(
      token,
      process.env.JWT_SECRET,
      async (err, decodedToken) => {
        if (!err) {
          const user = await User.findById(decodedToken.id);
          const { email, phoneNumber } = user;
          res.locals.userEmail = email;
          res.locals.username = user.email.substring(
            0,
            user.email.indexOf("@")
          );
          if (req.url === "/account") {
            res.locals.phoneNumber = phoneNumber;
          }
        } else {
          console.log(err);
          res.locals.userEmail = null;
          res.locals.username = null;
        }
      }
    );
  } else {
    res.locals.userEmail = null;
    res.locals.username = null;
  }
  next();
};

module.exports = {
  requireAuth,
  checkUser,
};
