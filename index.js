import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import connectDB from './config/db.connect.js';
import userRoutes from './routes/user.routes.js'
import adminRoutes from "./routes/admin.routes.js"
import { adminRegister } from './utils/adminRegister.js';
const app = express();
const PORT = process.env.PORT || 5050;

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(morgan('dev'));
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running 🚀",
    timestamp: new Date(),
  });
});


app.use('/api/user', userRoutes);
app.use('/api/admin' , adminRoutes)

await connectDB();
import("./cron/roi.cron.js")
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    adminRegister()
});         