const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const courseSchema = new Schema({
  number: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  instructor: {
    type: String,
    required: true,
  },
  seatsOpen: {
    type: String,
    required: true,
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now(),
  },
});

const Course = mongoose.model("course", courseSchema);

module.exports = Course;
