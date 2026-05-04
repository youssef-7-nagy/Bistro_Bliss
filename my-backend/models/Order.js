const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title: { type: String, required: true }, 
  image: { type: String }, 
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  specialInstructions: { type: String, default: "", trim: true, maxlength: 200 },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  

  userName: { type: String, required: true },

  items: { type: [orderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ["cash", "visa"],
    default: "cash",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  paymentIntentId: { type: String, default: null },
  status: {
    type: String,
    enum: ["pending", "delivered", "completed", "cancelled"],
    default: "pending",
  },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
module.exports = { Order };
