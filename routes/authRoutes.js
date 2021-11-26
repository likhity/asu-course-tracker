const { Router } = require("express");
const authController = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");

const router = Router();

router.get("/signup", authController.signup_get);
router.post("/signup", authController.signup_post);
router.get("/login", authController.login_get);
router.post("/login", authController.login_post);
router.get("/logout", authController.logout_get);
router.get("/account", requireAuth, authController.account_get);
router.put("/edit-phone-number", requireAuth, authController.edit_phone_put);
router.put("/change-password", requireAuth, authController.change_password_put);
router.get("/delete-account", requireAuth, authController.delete_account_get);
router.delete(
  "/delete-account",
  requireAuth,
  authController.delete_account_delete
);

module.exports = router;
