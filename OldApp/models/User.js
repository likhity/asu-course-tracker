const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    lowercase: true,
    validate: [isEmail, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: [6, "Password must have minimum length of 6 characters"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Please enter a phone number"],
  },
  courses: [
    {
      _id: false,
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    },
  ],
});

// fire a function before document is saved to DB
userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// static method to login user
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
  }
  throw Error("Either your password or email is incorrect");
};

const User = mongoose.model("user", userSchema);

module.exports = User;
