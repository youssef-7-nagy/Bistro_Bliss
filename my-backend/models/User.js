const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" }, 
    role: { type: String, enum: ["user", "admin"], default: "user" },
    resetPasswordToken: { 
        type: String, 
        default: null,
        sparse: true 
    },
  },
  { timestamps: true }          //for (created at) and (updated at)
);

const User = mongoose.model("User", userSchema);
module.exports = { User };