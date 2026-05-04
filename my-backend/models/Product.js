const { ref } = require("joi");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minLength: 3, maxLength: 120 },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, default: 0 },
    category: { 
    type: String, 
    required: true, 
    enum: ['breakfast', 'main course', 'desserts', 'drinks'] 
},

    images: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    owner:{
        type: mongoose.Schema.Types.ObjectId, 
        ref:"User",
        require: true,
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = { Product };