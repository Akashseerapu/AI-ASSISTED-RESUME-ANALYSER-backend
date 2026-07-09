const mongoose = require("mongoose");
const dns = require("dns");
console.log(process.env.MONGODB_URI); // Log the MongoDB URI to verify it's being read correctly

const connectDB = async () => {
  try {
    // Resolve DNS querySrv ECONNREFUSED issues on local network
    dns.setServers(["8.8.8.8", "8.8.4.4"]);

    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MongoDB URI is not defined in the environment variables!");
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
