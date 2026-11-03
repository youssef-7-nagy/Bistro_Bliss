const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

// Use public DNS to prevent local ISP ECONNREFUSED querySrv errors
dns.setServers(["8.8.8.8", "8.8.4.4"]);

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env.production") });
}
dotenv.config();

async function databaseConnection() {
  try {
    const mongoUri = process.env.DB_URL || process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("❌ MongoDB connection URL (DB_URL or MONGO_URI) is not configured in environment variables.");
      process.exit(1);
    }
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected!");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

module.exports = {
  databaseConnection,
};
