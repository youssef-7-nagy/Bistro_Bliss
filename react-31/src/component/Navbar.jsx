import React, { useState, useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { FaTwitter, FaFacebookF, FaInstagram, FaGithub, FaShoppingCart, FaBars, FaTimes } from "react-icons/fa";
import "./Navbar.css";
import logoSvg from "../assets/logo.svg";

export const Navbar = () => {
  const { islogged: isLoggedIn, userData } = useSelector((state) => state.user);

  const cartCount = useSelector((state) =>
    state.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  );

  const navRef = useRef(null);
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <span>yummy@bistrobliss</span>
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
          <span className="logo-text">Bistro Bliss</span>
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

              <li><NavLink to="/admin-panel">Admin Panel</NavLink></li> {/* 👈 ADDED HERE */}
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

          <NavLink to="/BookTable">
            <button className="btn-outline">Book A Table</button>
          </NavLink>
        </div>
      </nav>
    </>
  );
};