const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const dns = require("dns");

// Only override DNS servers for local development if not in Vercel/serverless
if (!process.env.VERCEL && typeof dns.setServers === "function") {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch (e) {
    // ignore if not supported
  }
}

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: path.resolve(__dirname, "../.env.production") });
}
dotenv.config();

let isConnected = false;

async function databaseConnection() {
  if (isConnected || mongoose.connection.readyState >= 1) {
    isConnected = true;
    return;
  }

  const mongoUri = process.env.DB_URL || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MongoDB connection URL (DB_URL or MONGO_URI) is missing in environment variables.");
    throw new Error("MongoDB connection URL missing");
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log("MongoDB Connected!");
  } catch (error) {
    console.error("MongoDB Connection Error:", error.message || error);
    isConnected = false;
    if (!process.env.VERCEL) {
      process.exit(1);
    }
    throw error;
  }
}

module.exports = {
  databaseConnection,
};
