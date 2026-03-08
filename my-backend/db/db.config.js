const mongoose = require("mongoose");    //connect to mongo db
const dotenv = require("dotenv");

dotenv.config();

async function databaseConnection() {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB Conntected!");             //if sucess print mongodb connected
  } catch (error) {
    console.log(error);    // y-print el error
    process.exit(1);      ///bey2fel  el process dih mara wahda    
  }
}

module.exports = {
  databaseConnection,
};
