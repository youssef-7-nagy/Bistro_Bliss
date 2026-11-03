import API_URL from "../utils/api";
import React, { useRef, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { FaEnvelope, FaArrowLeft } from "react-icons/fa"; 
import { Link, useNavigate } from "react-router-dom"; 

import "./Login.css"; 
import "./ForgotPassword.css"; 

export const ForgotPassword = () => {
  const emailRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = emailRef.current.value;

    if (!email) {
      return toast.error("Please enter your email address.");
    }

    setIsLoading(true);

    try {
    
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });

      toast.success(response.data.message || "Reset link sent! Check your inbox.");
      
     
      emailRef.current.value = "";
      setTimeout(() => navigate("/login"), 4000);

    } catch (error) {
      console.error("Forgot Password Error:", error);
      const errorMsg = error.response?.data?.message || "Failed to send reset link. Try again.";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-body">
      <div className="container forgot-container">
        <div className="forgot-form-wrapper">
          <form onSubmit={handleSubmit} className="forgot-form">
            <h1 className="forgot-title">Reset Password</h1>
            
            <p className="forgot-description">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            
            <div className="input-wrapper">
              <input 
                type="email" 
                placeholder="Enter your email" 
                ref={emailRef} 
                required 
                disabled={isLoading} 
              />
              <FaEnvelope className="input-icon" />
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? "btn-loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Sending Link..." : "Send Reset Link"}
            </button>
            
            <Link to="/login" className="back-link">
              <FaArrowLeft style={{ marginRight: '8px', fontSize: '10px' }} />
              Back to Login
            </Link>
          </form>
        </div>
      </div>
      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};