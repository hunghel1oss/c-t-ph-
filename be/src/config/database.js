const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("❌ MongoDB URI is missing in environment variables!");
    }

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected to Atlas");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    // process.exit(1);
  }
};

module.exports = connectDB;
