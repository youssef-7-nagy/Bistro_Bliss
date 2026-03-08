import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

export const NotFound = () => {
  return (
    
    <div className="not-found-bg">
      
    
      <div className="content-overlay">
        <span className="error-subtitle">Error 404</span>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-text">
          We apologize, but the page you are looking for does not exist. 
          Please return to our homepage or view our current menu.
        </p>

        <div className="btn-container">
          <Link to="/" className="btn-primary-brand">
            Return Home
          </Link>
          <Link to="/products" className="btn-outline-light">
            View Menu
          </Link>
        </div>
      </div>

    </div>
  );
};