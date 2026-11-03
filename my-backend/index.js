const dotenv = require("dotenv");
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
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
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

app.use("/auth", authRouter);
app.use("/products", authProducts);
app.use("/order", orderRouter);
app.use("/reservation", reservationRouter);

databaseConnection();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
