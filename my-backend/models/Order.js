const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title: { type: String, required: true }, 
  image: { type: String }, 
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  

  userName: { type: String, required: true },

  items: { type: [orderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "delivered", "completed", "cancelled"],
    default: "pending",
  },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
module.exports = { Order };