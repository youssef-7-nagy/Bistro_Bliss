const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller.js");
const { authMiddleWare } = require("../middlewares/auth.middleware.js");
const { roleMiddleWare } = require("../middlewares/role.middleware.js");

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