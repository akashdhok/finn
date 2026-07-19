import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
const MONGO_URL = process.env.MONGO_URL;
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URL);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;