import API_URL from "../utils/api";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { addPoints } from "../store/slices/userSlice";
import "./BookTable.css";

export const BookTable = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
    guests: "2 People",
  });

  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const dispatch = useDispatch();

  // Scroll to top on page mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const response = await axios.post(`${API_URL}/reservation`, formData, config);

      if (response.status === 201) {
        // Generate a random 6-character booking reference for the toast
        const randomRef = Math.random().toString(36).substring(2, 8).toUpperCase();
        setBookingRef(randomRef);

        // Update user points in redux live if we earned any
        if (response.data.pointsEarned) {
          dispatch(addPoints(response.data.pointsEarned));
        }

        setShowToast(true);
        // We delay clearing the form data so the toast can display the submitted details
      }
    } catch (error) {
      console.error("Booking Error:", error);
      alert("Failed to book. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // to hide toast after 12 seconds and clear the form
  useEffect(() => {
    let timer;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
        setFormData({ name: "", phone: "", date: "", time: "", guests: "2 People" });
      }, 12000);
    }
    return () => clearTimeout(timer);
  }, [showToast]);

  return (
    <div className="book-table-container">
      <div className="overlay"></div>

      <div className="booking-content">
        <h1>Book Your Table</h1>
        <p>We provide the best food for you and your family.</p>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Name</label>
            <input
              type="text" name="name" placeholder="Enter your name"
              required onChange={handleChange} value={formData.name}
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel" name="phone" placeholder="x-xxx-xxx-xxxx"
              required onChange={handleChange} value={formData.phone}
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" required onChange={handleChange} value={formData.date} />
          </div>

          <div className="form-group">
            <label>Time</label>
            <input type="time" name="time" required onChange={handleChange} value={formData.time} />
          </div>

          <div className="form-group full-width">
            <label>Total Person</label>
            <select name="guests" onChange={handleChange} value={formData.guests}>
              <option>1 Person</option>
              <option>2 People</option>
              <option>3 People</option>
              <option>4 People</option>
              <option>5+ People</option>
            </select>
          </div>

          <button type="submit" className="btn-submit" disabled={isSubmitting}>
            {isSubmitting ? "Booking..." : "Confirm Reservation"}
          </button>
        </form>
      </div>

      {/*DETAILED TOASTER  */}
      <div className={`toast-box ${showToast ? "active" : ""}`}>
        <div className="toast-icon">✅</div>
        <div className="toast-body">
          <h4>Reservation Confirmed!</h4>
          <p>We look forward to hosting you at Bistro Bliss, <strong>{formData.name || "Guest"}</strong>.</p>

          <div className="toast-receipt">
            <div className="receipt-row">
              <span>Booking Ref:</span>
              <span className="receipt-value ref-code">#{bookingRef}</span>
            </div>
            <div className="receipt-row">
              <span>Contact Phone:</span>
              <span className="receipt-value">{formData.phone}</span>
            </div>
          </div>

          <div className="toast-info-grid">
            <div className="info-item"><span>📅</span> {formData.date}</div>
            <div className="info-item"><span>⏰</span> {formData.time}</div>
            <div className="info-item"><span>👥</span> {formData.guests}</div>
          </div>

          <p className="toast-alert">⚠️ We hold tables for 15 minutes past reservation time.</p>
        </div>

        <button className="toast-close" onClick={() => {
          setShowToast(false);
          setFormData({ name: "", phone: "", date: "", time: "", guests: "2 People" });
        }}>&times;</button>

        <div className={`toast-progress ${showToast ? "run" : ""}`}></div>
      </div>

    </div>
  );
};