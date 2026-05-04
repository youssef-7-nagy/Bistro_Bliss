import React, { useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { FaArrowLeft, FaLock } from "react-icons/fa";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./Login.css";
import "./ForgotPassword.css";
import "./ResetPassword.css";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Reset token is missing from the link.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await axios.post("http://localhost:8080/auth/reset-password", {
        token,
        password,
        confirmPassword,
      });

      toast.success(response.data.message || "Password reset successfully.");
      setTimeout(() => navigate("/login"), 2200);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to reset password.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-body">
      <div className="container forgot-container reset-container">
        <div className="forgot-form-wrapper">
          <form onSubmit={handleSubmit} className="forgot-form">
            <h1 className="forgot-title">Set New Password</h1>
            <p className="forgot-description">
              Enter your new password below.
            </p>

            <div className="input-wrapper">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
              <FaLock className="input-icon" />
            </div>

            <div className="input-wrapper">
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={6}
                disabled={isLoading}
              />
              <FaLock className="input-icon" />
            </div>

            <button
              type="submit"
              className={`submit-btn ${isLoading ? "btn-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>

            <Link to="/login" className="back-link">
              <FaArrowLeft style={{ marginRight: "8px", fontSize: "10px" }} />
              Back to Login
            </Link>
          </form>
        </div>
      </div>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

