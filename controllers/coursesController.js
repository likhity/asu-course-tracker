const Course = require("../models/Course");
const User = require("../models/User");
const { format, parseISO } = require("date-fns");
const { gatherCourseInformation } = require("./gatherCourseInfo");

module.exports.track_courses_get = async (req, res) => {
  const { userEmail: email } = res.locals;
  const user = await User.findOne({ email });
  const allCoursesBeingTracked = [];
  for (const course of user.courses) {
    const courseFromDB = await Course.findById(course.id);
    courseFromDB.lastUpdatedString = format(courseFromDB.lastUpdated, "Pp");
    allCoursesBeingTracked.push(courseFromDB);
  }
  res.locals.courses = [...allCoursesBeingTracked];
  res.render("track-courses");
};

module.exports.track_courses_post = async (req, res) => {
  const { userEmail: email } = res.locals;
  const { courseNumber } = req.body;

  try {
    let course = await Course.findOne({ number: courseNumber });
    if (course == null) {
      const info = await gatherCourseInformation(courseNumber);
      if (info.error) {
        throw info;
      }
      info.lastUpdated = Date.now();
      course = await Course.create(info);
    }
    let user = await User.findOne({ email });

    const courseAlreadyBeingTracked = user.courses.some(
      (c) => `${c.id}` === course.id
    );

    if (!courseAlreadyBeingTracked) {
      user = await User.updateOne(
        { email },
        { $push: { courses: { id: course._id } } }
      );
    }

    res.status(201).send({ success: true });
  } catch (err) {
    res.status(400).send(err);
  }
};

module.exports.track_courses_delete = async (req, res) => {
  const { courseNumber: number } = req.body;

  try {
    const course = await Course.findOne({ number });
    await User.updateOne(
      { email: res.locals.userEmail },
      { $pull: { courses: { id: course._id } } }
    );
    res.status(200).send({ success: true });
  } catch (err) {
    res.status(400).send({ success: false });
  }
};
