import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { FaTwitter, FaFacebookF, FaInstagram, FaGithub, FaShoppingCart, FaBars, FaTimes, FaSignOutAlt } from "react-icons/fa";
import { logout } from "../store/slices/userSlice";
import { resetCartSession } from "../store/slices/CartSlice";
import "./Navbar.css";
import logoSvg from "../assets/logo.svg";

export const Navbar = () => {
  const { islogged: isLoggedIn, userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cartCount = useSelector((state) =>
    state.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  );

  const navRef = useRef(null);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(resetCartSession());
    dispatch(logout());
    navigate("/Login");
  };

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (!navRef.current) return;
  }, [location.pathname]);

  return (
    <>
      <div className="top-bar">
        <div className="contact-info">
          <span>(414) 857 - 0107</span>
          <span>yummy@velmorabliss</span>
        </div>

        <div className="social-links">
          <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-icon twitter">
            <FaTwitter className="icon" /><span className="tooltip">Twitter</span>
          </a>
          <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-icon facebook">
            <FaFacebookF className="icon" /><span className="tooltip">Facebook</span>
          </a>
          <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-icon instagram">
            <FaInstagram className="icon" /><span className="tooltip">Instagram</span>
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="social-icon github">
            <FaGithub className="icon" /><span className="tooltip">GitHub</span>
          </a>
        </div>
      </div>

      <nav className="navbar">
        <div
          className="logo"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ cursor: 'pointer' }}
        >
          <img src={logoSvg} alt="Bistro Bliss Logo" className="logo-img" />
          <span className="logo-text">Velmora Bliss</span>
        </div>

        <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <ul className={`nav-links ${isMobileMenuOpen ? 'mobile-active' : ''}`} ref={navRef}>
          <li><NavLink to="/">Home</NavLink></li>

          <li><NavLink to="/AboutUs">About</NavLink></li>

          <li><NavLink to="/Products">Menu</NavLink></li>

          {isLoggedIn && (
            <li><NavLink to="/Profile">Profile</NavLink></li>
          )}


          {isLoggedIn && userData?.role === "admin" && (
            <>

              <li><NavLink to="/admin-panel">Admin Panel</NavLink></li> 
            </>
          )}

          {!isLoggedIn && (
            <li><NavLink to="/Login">Login</NavLink></li>
          )}
        </ul>

        <div className="nav-buttons">
          <NavLink to="/Cart" className="cart-btn-wrapper">
            <div className="cart-icon-container">
              <FaShoppingCart className="cart-icon" />
              <span className="cart-text">Order</span>
              <span className="cart-badge">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            </div>
          </NavLink>

          {isLoggedIn && (
            <button
              className="btn-outline"
              onClick={handleLogout}
              style={{ padding: "0.5rem 1rem", borderColor: "#e74c3c", color: "#e74c3c", display: "flex", alignItems: "center", gap: "5px" }}
            >
              <FaSignOutAlt /> Logout
            </button>
          )}

          <NavLink to="/BookTable">
            <button className="btn-outline">Book A Table</button>
          </NavLink>
        </div>
      </nav>
    </>
  );
};
