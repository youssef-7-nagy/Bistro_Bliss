const Reservation = require("../models/Reservation");
const { User } = require("../models/User");

exports.createReservation = async (req, res) => {
  try {
    const { name, phone, date, time, guests } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!name || !phone || !date || !time) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const newReservation = await Reservation.create({ userId, name, phone, date, time, guests });

    let pointsEarned = 0;
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        pointsEarned = 5; // Award 5 points per reservation
        user.points = (user.points || 0) + pointsEarned;
        await user.save();
      }
    }

    res.status(201).json({ message: `Reservation Created! You earned ${pointsEarned} points.`, pointsEarned, data: newReservation });
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