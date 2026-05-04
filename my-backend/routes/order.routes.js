const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const { authMiddleWare } = require("../middlewares/auth.middleware");
const { roleMiddleWare } = require("../middlewares/role.middleware");

router.post("/", authMiddleWare, orderController.createOrder);
router.post("/create-payment-intent", authMiddleWare, orderController.createPaymentIntent);
router.get("/user/my-orders", authMiddleWare, orderController.getUserOrders);


router.get("/admin/all", authMiddleWare, roleMiddleWare("admin"), orderController.getAllOrders);
router.put("/:id/status", authMiddleWare, roleMiddleWare("admin"), orderController.updateOrderStatus);

module.exports = router;
