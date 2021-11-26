const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const coursesRoutes = require("./routes/coursesRoutes");
const cookieParser = require("cookie-parser");
const { requireAuth, checkUser } = require("./middleware/authMiddleware");
const { checkForUpdatesAndSendMessages } = require("./controllers/sendMessage");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());

// view engine
app.set("view engine", "ejs");

// database connection
const dbURI = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.e7dy3.mongodb.net/${process.env.MONGODB_DATABASE_NAME}`;
mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then((result) => {
    console.log("Connected to DB");
    app.listen(PORT, console.log(`Server listening on port ${PORT}`));
    // run "checkForUpdatesAndSendMessages" thirty minutes
    const intervalTimeInMinutes = 10;
    const secondsInAMinute = 60;
    const millisecondsInASecond = 1000;
    const intervalTimeInMilliseconds =
      intervalTimeInMinutes * secondsInAMinute * millisecondsInASecond;

    setInterval(checkForUpdatesAndSendMessages, intervalTimeInMilliseconds);
  })
  .catch((err) => console.log(err));

// routes
app.get("*", checkUser);
app.get("/", (req, res) => {
  res.render("home");
});
app.use(authRoutes);
app.use(coursesRoutes);
