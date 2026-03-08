import React from "react";
import "./Footer.css";
/* Added FaGithub to the imports */
import { FaFacebookF, FaInstagram, FaTwitter, FaGithub } from "react-icons/fa";
import logoSvg from "../assets/logo.svg";

export const Footer = () => {
  return (
    <footer className="footer-compact">
      <div className="footer-container">


        <div className="footer-brand">
          <div
            className="logo-area"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ cursor: 'pointer' }}
          >
            <img src={logoSvg} alt="Bistro Bliss Logo" className="logo-img" style={{ height: '35px', borderRadius: '6px' }} />
            <h2>Bistro Bliss</h2>
          </div>
        </div>


        <div className="footer-quote">
          "Where smiles are always on the menu."
        </div>


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

            {/* GitHub (NEW) */}
            <a href="#" className="social-icon github">
              <FaGithub className="icon" />
              <span className="tooltip">GitHub</span>
            </a>
          </div>

          <p className="copyright">© {new Date().getFullYear()} Bistro Bliss</p>
        </div>

      </div>
    </footer>
  );
};