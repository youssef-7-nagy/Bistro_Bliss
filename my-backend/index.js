const dotenv = require("dotenv");
const path = require("path");

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: path.resolve(__dirname, ".env.production") });
}
dotenv.config();

const express = require("express");
const cors = require("cors");
const passport = require("passport");
require("./config/passport.config");
const { databaseConnection } = require("./db/db.config");

const authRouter = require("./routes/auth.routes");
const authProducts = require("./routes/products.routes");
const orderRouter = require("./routes/order.routes");
const reservationRouter = require("./routes/reservation.routes");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "https://velmora-bliss-9iqf.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(passport.initialize());

app.use(
  "/uploads",
  express.static("uploads", {
    maxAge: "30d",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
    },
  })
);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Bistro Bliss Backend is running 🚀" });
});

app.use("/auth", authRouter);
app.use("/products", authProducts);
app.use("/order", orderRouter);
app.use("/reservation", reservationRouter);

databaseConnection();

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
