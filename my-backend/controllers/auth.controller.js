const { User } = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { registerSchema, loginSchema } = require("../validators/auth.validator");

dotenv.config();

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

async function register(request, response) {
  const { error } = registerSchema.validate(request.body, { abortEarly: false });
  if (error) return response.status(400).json({ message: error.details.map((item) => item.message) });

  try {
    const { email, password, name } = request.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return response.status(400).json({ message: "Email Already used..." });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword, name });
    const token = generateToken(user);

    response.status(201).json({
      message: "Registration successful! 🎉",
      data: { token, user: { email, name, role: user.role } },
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "internal server error.." });
  }
}

async function login(request, response) {
  try {
    const { error } = loginSchema.validate(request.body);
    if (error) return response.status(400).json({ message: error.message });

    const { email, password } = request.body;
    const user = await User.findOne({ email });
    if (!user) return response.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return response.status(400).json({ message: "Invalid Credentials" });

    const token = generateToken(user);
    response.json({
      message: "user logged in successfully ..",
      data: { token, user: { _id: user._id, email, name: user.name, role: user.role, phone: user.phone } },
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "internal server error.." });
  }
}

async function validateMe(request, response) {
  try {
    const id = request.user.id;
    const user = await User.findById(id);
    response.json({
      message: "user logged in",
      isLoggedIn: true,
      data: { user: { _id: user._id, email: user.email, name: user.name, role: user.role, phone: user.phone } },
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "internal server error.." });
  }
}

async function updateProfile(request, response) {
  try {
    const { name, phone, password } = request.body;
    const userId = request.user.id;
    const user = await User.findById(userId);
    if (!user) return response.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 12);
    }
    await user.save();

    response.json({
      message: "Profile updated successfully! ✅",
      data: { user: { _id: user._id, email: user.email, name: user.name, phone: user.phone, role: user.role } },
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" });
  }
}

async function getAllUsers(request, response) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    response.json({ message: "All users fetched", data: users });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" });
  }
}


async function updateUserRole(request, response) {
  try {
    const { id } = request.params;
    const { role } = request.body;

    const user = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
    
    if (!user) return response.status(404).json({ message: "User not found" });

    response.json({ message: `Role updated to ${role}`, data: user });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "Internal server error" });
  }
}

async function forgotPassword(req, res) {}
async function resetPassword(req, res) {}

module.exports = {
  register,
  login,
  validateMe,
  updateProfile,
  getAllUsers,
  updateUserRole, 
  forgotPassword,
  resetPassword,
};