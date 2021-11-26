const Course = require("../models/Course");
const User = require("../models/User");
const { getCourseSeatsOpen } = require("./gatherCourseInfo");
require("dotenv").config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

async function checkForUpdatesAndSendMessages() {
  console.log("Checking for updates...");
  const allCourses = await Course.find();
  for (const course of allCourses) {
    const newSeatsOpen = await getCourseSeatsOpen(course.number);
    console.log(
      `${course.number} ${course.title} Old: ${course.seatsOpen} New: ${newSeatsOpen}`
    );
    if (course.seatsOpen !== newSeatsOpen) {
      console.log(
        `A course was found with different seatsOpen: (${course.number}) ${course.seatsOpen} to ${newSeatsOpen}`
      );
      await Course.updateOne(
        { number: course.number },
        { seatsOpen: newSeatsOpen, lastUpdated: Date.now() }
      );
      await sendTextMessageToAllUsersWithCourse(
        course.seatsOpen,
        newSeatsOpen,
        course
      );
    } else {
      await Course.updateOne(
        { number: course.number },
        { lastUpdated: Date.now() }
      );
    }
  }
}

async function sendTextMessageToAllUsersWithCourse(
  oldSeatsOpen,
  newSeatsOpen,
  course
) {
  const allUsers = await User.find();

  for (const user of allUsers) {
    if (user.courses.some((c) => `${c.id}` === course.id)) {
      client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+1${user.phoneNumber}`,
        body: `Hello, ${user.email}. This is a notification from ASU Course Tracker. The seats for the class ${course.title} (${course.number}) changed from "${oldSeatsOpen}" to "${newSeatsOpen}".`,
      });
    }
  }
}

module.exports = {
  checkForUpdatesAndSendMessages,
};
