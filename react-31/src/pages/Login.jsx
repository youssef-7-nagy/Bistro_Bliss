import React, { useState, useRef } from "react";
import "./Login.css";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { setUser } from "../store/slices/userSlice";
import { auth, googleProvider, facebookProvider } from "../store/slices/firebase";
import { signInWithPopup } from "firebase/auth";
import {
  FaGoogle, FaFacebookF, FaGithub, FaLinkedinIn,
  FaUser, FaEnvelope, FaLock
} from "react-icons/fa";

export const Login = () => {
  const [isActive, setIsActive] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const regNameRef = useRef(null);
  const regEmailRef = useRef(null);
  const regPasswordRef = useRef(null);
  const loginEmailRef = useRef(null);
  const loginPasswordRef = useRef(null);

  const handleRegisterClick = () => setIsActive(true);
  const handleLoginClick = () => setIsActive(false);

  const submitRegister = async (event) => {
    event.preventDefault();

    const data = {
      name: regNameRef.current.value,
      email: regEmailRef.current.value,
      password: regPasswordRef.current.value,
    };

    try {
      const response = await axios.post("http://localhost:8080/auth/register", data);
      const { data: UserData } = response.data;

      localStorage.setItem("token", UserData.token);
      dispatch(setUser(UserData.user));

      toast.success("Account Created Successfully!");
      setTimeout(() => { navigate("/Profile"); }, 1000);

    } catch (error) {
      console.error("Register Error:", error.response?.data);
      const errorMsg = error.response?.data?.message || "Registration failed";
      toast.error(errorMsg);
    }
  };

  // --- LOGIN ---
  const submitLogin = async (event) => {
    event.preventDefault();

    const data = {
      email: loginEmailRef.current.value,
      password: loginPasswordRef.current.value,
    };

    try {
      const response = await axios.post("http://localhost:8080/auth/login", data);
      const { data: UserData } = response.data;

      localStorage.setItem("token", UserData.token);
      dispatch(setUser(UserData.user));

      toast.success("Login Successfully");
      setTimeout(() => { navigate("/Profile"); }, 1000);

    } catch (error) {
      console.error("Login Error:", error.response?.data);
      const errorMsg = error.response?.data?.message || "Login failed. Check details.";
      toast.error(errorMsg);
    }
  };

  // --- FIREBASE SOCIAL LOGIN ---
  const handleSocialLogin = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Sync Firebase user with Node.js backend
      const response = await axios.post("http://localhost:8080/auth/social-login", {
        email: user.email,
        name: user.displayName || "User",
        firebaseUid: user.uid
      });

      const { data: UserData } = response.data;

      // Save backend's JWT token and start session
      localStorage.setItem("token", UserData.token);
      dispatch(setUser(UserData.user));

      toast.success(`Logged in with ${provider.providerId} via backend successfully!`);
      setTimeout(() => { navigate("/Profile"); }, 1000);
    } catch (error) {
      console.error("Social Auth Error:", error);
      const errorMsg = error.response?.data?.message || error.message || "Social login failed";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="login-body">
      <div className={`login-container ${isActive ? "active" : ""}`} id="container">

        {/* --- REGISTER FORM --- */}
        <div className="form-container sign-up">
          <form onSubmit={submitRegister}>
            <h1>Create Account</h1>
            <div className="social-icons">
              <a href="#" className="icon" onClick={(e) => { e.preventDefault(); handleSocialLogin(googleProvider); }}><FaGoogle /></a>
              <a href="#" className="icon" onClick={(e) => { e.preventDefault(); handleSocialLogin(facebookProvider); }}><FaFacebookF /></a>
              <a href="#" className="icon"><FaGithub /></a>
              <a href="#" className="icon"><FaLinkedinIn /></a>
            </div>
            <span>or use your email for registration</span>
            <div className="input-wrapper">
              <input type="text" placeholder="Name" ref={regNameRef} required />
              <FaUser className="input-icon" />
            </div>
            <div className="input-wrapper">
              <input type="email" placeholder="Email" ref={regEmailRef} required />
              <FaEnvelope className="input-icon" />
            </div>
            <div className="input-wrapper">
              <input type="password" placeholder="Password" ref={regPasswordRef} required />
              <FaLock className="input-icon" />
            </div>
            <button type="submit">Sign Up</button>
          </form>
        </div>

        {/* --- LOGIN FORM --- */}
        <div className="form-container sign-in">
          <form onSubmit={submitLogin}>
            <h1>Sign In</h1>
            <div className="social-icons">
              <a href="#" className="icon" onClick={(e) => { e.preventDefault(); handleSocialLogin(googleProvider); }}><FaGoogle /></a>
              <a href="#" className="icon" onClick={(e) => { e.preventDefault(); handleSocialLogin(facebookProvider); }}><FaFacebookF /></a>
              <a href="#" className="icon"><FaGithub /></a>
              <a href="#" className="icon"><FaLinkedinIn /></a>
            </div>
            <span>or use your email password</span>
            <div className="input-wrapper">
              <input type="email" placeholder="Email" ref={loginEmailRef} required />
              <FaEnvelope className="input-icon" />
            </div>
            <div className="input-wrapper">
              <input type="password" placeholder="Password" ref={loginPasswordRef} required />
              <FaLock className="input-icon" />
            </div>

            <Link to="/forgot-password" style={{ marginTop: "15px", marginBottom: "10px" }}>
              Forget Your Password?
            </Link>

            <button type="submit">Sign In</button>
          </form>
        </div>

        {/* --- TOGGLE PANEL --- */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-left">
              <h1>Welcome Back!</h1>
              <p>Enter your personal details to use all of site features</p>
              <button className="hidden" onClick={handleLoginClick}>Sign In</button>
            </div>
            <div className="toggle-panel toggle-right">
              <h1>Hello, Friend!</h1>
              <p>Register with your personal details to use all of site features</p>
              <button className="hidden" onClick={handleRegisterClick}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};