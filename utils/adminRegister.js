import dotenv from "dotenv"
dotenv.config({ quiet: true })
import Admin from "../models/admin.model.js";
import bcrypt from "bcryptjs";
const name = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const mobile = process.env.ADMIN_MOBILE;

export const adminRegister = async () => {
  try {
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log("✅ Admin already exists");
      return;
    }

    if (!name || !email || !password) {
      console.log("❌ Admin env variables missing");
      return;
    }
     const hashPassword = await bcrypt.hash(password , 10);
    await Admin.create({
      name,
      email,
      password : hashPassword, 
      mobile,
      role: "Admin",
      isActive: true,
    });

    console.log("🚀 Admin created successfully");

  } catch (error) {
    console.error("❌ Admin auto-create error:", error.message);
  }
};
