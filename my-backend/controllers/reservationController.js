const Reservation = require("../models/Reservation");

exports.createReservation = async (req, res) => {
  try {
    const { name, phone, date, time, guests } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!name || !phone || !date || !time) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const newReservation = await Reservation.create({ userId, name, phone, date, time, guests });
    res.status(201).json({ message: "Reservation Created!", data: newReservation });
  } catch (error) {
    console.error("Reservation Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

// 👇 NEW ADMIN FUNCTION: Get All Reservations
exports.getAllReservations = async (req, res) => {
  try {
    const bookings = await Reservation.find().sort({ createdAt: -1 });
    res.json({ message: "All Bookings", data: bookings });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};


exports.updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; 
    const booking = await Reservation.findByIdAndUpdate(id, { status }, { new: true });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json({ message: `Booking ${status}`, data: booking });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};