const { User } = require("../models/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const { registerSchema, loginSchema } = require("../validators/auth.validator");
const { transporter, readEnv } = require("../utils/mailer");

dotenv.config();

const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

async function register(request, response) {
  const { error } = registerSchema.validate(request.body, { abortEarly: false });
  if (error) return response.status(400).json({ message: error.details.map((item) => item.message) });

  try {
    const { password, name } = request.body;
    const email = String(request.body.email || "").trim().toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser) return response.status(400).json({ message: "Email Already used..." });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ email, password: hashedPassword, name });
    const token = generateToken(user);

    response.status(201).json({
      message: "Registration successful! 🎉",
      data: { token, user: { email, name, role: user.role, points: user.points || 0, activeReward: user.activeReward || null } },
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

    const email = String(request.body.email || "").trim().toLowerCase();
    const { password } = request.body;
    const user = await User.findOne({ email });
    if (!user) return response.status(400).json({ message: "Invalid Credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return response.status(400).json({ message: "Invalid Credentials" });

    const token = generateToken(user);
    response.json({
      message: "user logged in successfully ..",
      data: { token, user: { _id: user._id, email, name: user.name, role: user.role, phone: user.phone, points: user.points || 0, activeReward: user.activeReward || null } },
    });
  } catch (error) {
    console.log(error);
    response.status(500).json({ message: "internal server error.." });
  }
}

async function socialLogin(request, response) {
  try {
    const email = String(request.body.email || "").trim().toLowerCase();
    const { name } = request.body;

    if (!email) {
      return response.status(400).json({ message: "Email is required for social login." });
    }

    let user = await User.findOne({ email });

    // If user doesn't exist, create them
    if (!user) {
      const generatedPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(generatedPassword, 12);

      user = await User.create({
        email,
        password: hashedPassword,
        name: name || "User"
      });
    }

    const token = generateToken(user);

    response.json({
      message: "Social login successful",
      data: { token, user: { _id: user._id, email: user.email, name: user.name, role: user.role, phone: user.phone, points: user.points || 0, activeReward: user.activeReward || null } },
    });
  } catch (error) {
    console.log("Social Login Error:", error);
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
      data: { user: { _id: user._id, email: user.email, name: user.name, role: user.role, phone: user.phone, points: user.points || 0, activeReward: user.activeReward || null } },
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
      data: { user: { _id: user._id, email: user.email, name: user.name, phone: user.phone, role: user.role, points: user.points || 0 } },
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

async function redeemReward(request, response) {
  try {
    const userId = request.user.id;
    const { rewardType, cost } = request.body;

    const user = await User.findById(userId);
    if (!user) return response.status(404).json({ message: "User not found" });

    if (user.points < cost) {
      return response.status(400).json({ message: "Not enough points." });
    }

    if (user.activeReward) {
      return response.status(400).json({ message: "You already have an active reward! Use it first." });
    }

    user.points -= cost;
    user.activeReward = rewardType;
    await user.save();

    response.json({
      message: "Reward redeemed successfully!",
      data: { points: user.points, activeReward: user.activeReward }
    });
  } catch (error) {
    console.log("Redeem Error:", error);
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

async function forgotPassword(req, res) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    // Generic message to avoid email enumeration
    const genericMessage = "If an account exists, a reset link has been sent to your email.";

    if (!user) {
      return res.status(200).json({ message: genericMessage });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    const clientBaseUrl = readEnv("CLIENT_URL", readEnv("FRONTEND_URL", "http://localhost:5173"));
    const resetLink = `${clientBaseUrl}/reset-password?token=${resetToken}`;
    const senderEmail = readEnv("SMTP_USER");
    const senderPassword = readEnv("SMTP_PASSWORD");

    if (!senderEmail) {
      return res.status(500).json({
        message: "Email server is not configured. Set SMTP_USER and SMTP_PASSWORD.",
      });
    }

    if (senderEmail.endsWith("@ethereal.email")) {
      return res.status(500).json({
        message:
          "You are using Ethereal test SMTP. To send real emails to Gmail, set SMTP_SERVICE=gmail and use a real Gmail + App Password.",
      });
    }

    if (!senderPassword || senderPassword.includes("your_gmail_app_password")) {
      return res.status(500).json({
        message:
          "SMTP_PASSWORD is still a placeholder. Put your real Gmail App Password in my-backend/.env and restart backend.",
      });
    }

    await transporter.sendMail({
      from: senderEmail,
      to: user.email,
      subject: "Reset your Bistro Bliss password",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
          <h2 style="margin-bottom: 8px;">Password Reset Request</h2>
          <p>Hello ${user.name || ""},</p>
          <p>We received a request to reset your password.</p>
          <p>
            <a href="${resetLink}" style="background:#AD343E;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block;">
              Reset Password
            </a>
          </p>
          <p>This link expires in 15 minutes.</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
      text: `Reset your password using this link: ${resetLink} (expires in 15 minutes)`,
    });

    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    console.log("Forgot Password Error:", error);
    return res.status(500).json({
      message:
        "Failed to send reset email. Check SMTP config (for Gmail use SMTP_SERVICE=gmail, SMTP_USER, and Gmail App Password).",
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: "Token and passwords are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or expired." });
    }

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successful. You can login now." });
  } catch (error) {
    console.log("Reset Password Error:", error);
    return res.status(500).json({ message: "Failed to reset password." });
  }
}

async function googleCallback(request, response) {
  const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173";
  try {
    const user = request.user;
    if (!user) {
      return response.redirect(`${clientUrl}/login?error=auth_failed`);
    }

    const token = generateToken(user);
    return response.redirect(`${clientUrl}/login?token=${token}`);
  } catch (error) {
    console.error("Google Callback Error:", error);
    return response.redirect(`${clientUrl}/login?error=server_error`);
  }
}

module.exports = {
  register,
  login,
  socialLogin,
  googleCallback,
  validateMe,
  updateProfile,
  getAllUsers,
  updateUserRole,
  redeemReward,
  forgotPassword,
  resetPassword,
};
