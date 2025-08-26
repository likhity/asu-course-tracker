const { Router } = require("express");
const coursesController = require("../controllers/coursesController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = Router();

router.use(requireAuth);
router.get("/track-courses", coursesController.track_courses_get);
router.post("/track-courses", coursesController.track_courses_post);
router.delete("/track-courses", coursesController.track_courses_delete);

module.exports = router;
