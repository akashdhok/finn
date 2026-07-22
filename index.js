import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import morgan from "morgan";

import connectDB from "./config/db.connect.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { adminRegister } from "./utils/adminRegister.js";

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running 🚀",
    timestamp: new Date(),
  });
});

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

await connectDB();
import("./cron/roi.cron.js");

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  adminRegister();
});