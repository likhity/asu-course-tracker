const axios = require("axios");
const { JSDOM } = require("jsdom");

module.exports.gatherCourseInformation = async (courseNumber) => {
  const courseInfo = {};
  const res = await axios({
    method: "get",
    url: "https://webapp4.asu.edu/catalog/coursedetails",
    params: {
      r: courseNumber,
    },
  });

  const dom = new JSDOM(res.data).window.document;
  const errorMessage = dom.querySelector("div.noResults").textContent;
  if (errorMessage.includes("were found that matched your criteria")) {
    return {
      error: errorMessage,
    };
  }
  courseInfo.number = courseNumber;
  courseInfo.title = dom
    .querySelector("h2")
    .textContent.trim()
    .match(/^[^-]*/g)[0]
    .trim();
  courseInfo.instructor = dom
    .querySelectorAll(".class-values")[4]
    .querySelector("a span")
    .textContent.trim();
  courseInfo.seatsOpen = dom
    .querySelector("#details-side-panel span")
    .textContent.match(/\d+ of \d+/g)[0];
  return courseInfo;
};

module.exports.getCourseSeatsOpen = async (courseNumber) => {
  const res = await axios({
    method: "get",
    url: "https://webapp4.asu.edu/catalog/coursedetails",
    params: {
      r: courseNumber,
    },
  });

  const dom = new JSDOM(res.data).window.document;

  return dom
    .querySelector("#details-side-panel span")
    .textContent.match(/\d+ of \d+/g)[0];
};
