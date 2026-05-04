import React from "react";
import "./Footer.css";
import { FaFacebookF, FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";
import logoSvg from "../assets/logo.svg";

export const Footer = () => {
  return (
    <footer className="footer-compact">
      <div className="footer-container">
       
        
        {/* Left Side: Brand */}
        <div className="footer-brand">
          <div
            className="logo-area"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ cursor: "pointer" }}
          >
            <img
              src={logoSvg}
              alt="Velmora Bliss Logo"
              className="logo-img"
            />
            <h2>Velmora Bliss</h2>
          </div>
        </div>

        {/* Center: Quote */}
        <div className="footer-quote">
          " Where smiles are always on the menu "
        </div>

        {/* Right Side: Social & Copyright */}
        <div className="footer-social">
          <div className="social-icons">
            {/* Facebook */}
            <a href="#" className="social-icon facebook">
              <FaFacebookF className="icon" />
              <span className="tooltip">Facebook</span>
            </a>

            {/* Instagram */}
            <a href="#" className="social-icon instagram">
              <FaInstagram className="icon" />
              <span className="tooltip">Instagram</span>
            </a>

            {/* Twitter */}
            <a href="#" className="social-icon twitter">
              <FaTwitter className="icon" />
              <span className="tooltip">Twitter</span>
            </a>

            {/* GitHub */}
            <a href="#" className="social-icon github">
              <FaGithub className="icon" />
              <span className="tooltip">GitHub</span>
            </a>
          </div>

          <p className="copyright">
            {"\u00A9"} {new Date().getFullYear()} Velmora Bliss
          </p>
        </div>
      </div>
    </footer>
  );
};