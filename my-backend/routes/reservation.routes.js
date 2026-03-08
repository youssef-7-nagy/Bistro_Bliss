const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const { authMiddleWare } = require("../middlewares/auth.middleware.js");
const { roleMiddleWare } = require("../middlewares/role.middleware.js");

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    return authMiddleWare(req, res, next);
  }
  next();
};

router.post("/", optionalAuth, reservationController.createReservation);
router.get("/user/my-reservations", authMiddleWare, reservationController.getMyReservations);


router.get("/admin/all", authMiddleWare, roleMiddleWare("admin"), reservationController.getAllReservations);
router.put("/:id/status", authMiddleWare, roleMiddleWare("admin"), reservationController.updateReservationStatus);

module.exports = router;