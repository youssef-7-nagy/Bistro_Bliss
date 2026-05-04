const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { databaseConnection } = require("./db/db.config");


const authRouter = require("./routes/auth.routes");
const authProducts = require("./routes/products.routes");
const orderRouter = require("./routes/order.routes");
const reservationRouter = require("./routes/reservation.routes"); 

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL }));
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
