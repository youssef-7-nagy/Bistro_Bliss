const { Order } = require("../models/Order");
const { Product } = require("../models/Product"); 
const { User } = require("../models/User");

async function createOrder(request, response) {
  try {
    const { items } = request.body;
    const userId = request.user.id;

    const currentUser = await User.findById(userId);
    if (!currentUser) return response.status(404).json({ message: "User not found" });

    if (!items || items.length === 0) return response.status(400).json({ message: "No Items Found" });

    let totalAmount = 0;
    const orderItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product) return response.status(404).json({ message: `Product not found` });

      orderItems.push({
        product: product._id,
        title: product.title,       
        image: product.images?.[0], 
        quantity: item.quantity,
        price: product.price 
      });

      totalAmount += product.price * item.quantity;
    }

    const newOrder = await Order.create({
      user: userId,
      userName: currentUser.name,
      items: orderItems,
      totalAmount
    });

    response.status(201).json({ message: "Order created Successfully!", data: { order: newOrder } });
  } catch (error) {
    console.log("Create Order Error:", error);
    response.status(500).json({ message: "Internal server error" });
  }
}

async function getUserOrders(request, response) {
  try {
    const userId = request.user.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    response.json({ message: "User orders fetched", data: orders });
  } catch (error) {
    console.log("Get Orders Error:", error);
    response.status(500).json({ message: "Internal server error" });
  }
}


async function getAllOrders(req, res) {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json({ message: "All Orders", data: orders });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}


async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order status updated", data: order });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

module.exports = { createOrder, getUserOrders, getAllOrders, updateOrderStatus };