const express = require("express");
const router = express.Router();
const passport = require("passport");
const authController = require("../controllers/auth.controller.js");
const { authMiddleWare } = require("../middlewares/auth.middleware.js");
const { roleMiddleWare } = require("../middlewares/role.middleware.js");

const PROD_FRONTEND_URL = "https://velmora-bliss-9iqf.vercel.app";
const PROD_BACKEND_URL = "https://bistro-bliss-three.vercel.app";

function getCallbackURL(req) {
  if (
    process.env.GOOGLE_CALLBACK_URL &&
    !process.env.GOOGLE_CALLBACK_URL.includes("localhost") &&
    !process.env.GOOGLE_CALLBACK_URL.includes("127.0.0.1")
  ) {
    return process.env.GOOGLE_CALLBACK_URL;
  }

  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  if (isProduction) {
    const host = req.get("x-forwarded-host") || req.get("host");
    const proto = req.get("x-forwarded-proto") || (req.secure ? "https" : "http");
    if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
      return `${proto}://${host}/auth/google/callback`;
    }
    return `${PROD_BACKEND_URL}/auth/google/callback`;
  }

  return process.env.GOOGLE_CALLBACK_URL || "http://localhost:8080/auth/google/callback";
}

function getClientRedirectBase(req) {
  const envUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL;
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
  if (isProduction) {
    if (envUrl && !envUrl.includes("localhost") && !envUrl.includes("127.0.0.1")) {
      return envUrl.replace(/\/$/, "");
    }
    return PROD_FRONTEND_URL;
  }
  return envUrl ? envUrl.replace(/\/$/, "") : "http://localhost:5173";
}

// Google OAuth routes
router.get("/google", (req, res, next) => {
  const callbackURL = getCallbackURL(req);
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    callbackURL,
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    const callbackURL = getCallbackURL(req);
    const clientUrl = getClientRedirectBase(req);
    passport.authenticate("google", {
      session: false,
      callbackURL,
      failureRedirect: `${clientUrl}/login?error=google_failed`,
    })(req, res, next);
  },
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
