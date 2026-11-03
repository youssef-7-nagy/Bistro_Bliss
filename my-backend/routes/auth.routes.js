const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/auth.controller.js");
const { authMiddleWare } = require("../middlewares/auth.middleware.js");
const { roleMiddleWare } = require("../middlewares/role.middleware.js");

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:5173"}/login?error=google_failed`,
  }),
  authController.googleCallback
);

router.get("/me", authMiddleWare, authController.validateMe);
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/social-login", authController.socialLogin);
router.post("/redeem", authMiddleWare, authController.redeemReward);
router.put("/update", authMiddleWare, authController.updateProfile);

router.get("/users", authMiddleWare, roleMiddleWare("admin"), authController.getAllUsers);
router.put("/users/:id/role", authMiddleWare, roleMiddleWare("admin"), authController.updateUserRole);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
