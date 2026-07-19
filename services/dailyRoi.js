import PercentageModel from "../models/percentage.model.js";
import ROIHistoryModel from "../models/roi.model.js";
import User from "../models/user.model.js";
import { distributeROIOnROI } from "./roiOnroi.js";


export const distributeDailyROI = async () => {
  try {
    console.log("⏳ Running Daily ROI...");

    const dailyROI = 0.5

    const users = await User.find({ status: true });

    for (const user of users) {
      const investment = user.myInvestment;

      if (!investment || investment <= 0) continue;

      const maxEarning = investment * 2;

      if (user.totalEarnings >= maxEarning) continue;

      let roiAmount = (investment * dailyROI) / 100;

      if (user.totalEarnings + roiAmount > maxEarning) {
        roiAmount = maxEarning - user.totalEarnings;
      }

      if (roiAmount <= 0) continue;

      // ✅ USER ROI UPDATE
      user.dailyROI = roiAmount;
      user.monthlyROI = roiAmount;
      user.totalEarnings += roiAmount;
      user.todayEarnings += roiAmount;

      await user.save();

      // ✅ ROI HISTORY
      await ROIHistoryModel.create({
        userId: user._id,
        amount: roiAmount,
        investment: investment,
        type: "daily_roi",
      });

      // 🔥 ✅ ROI ON ROI (YAHI LAGANA THA)
      await distributeROIOnROI(user._id, roiAmount);
    }

    console.log("✅ Daily ROI Distributed Successfully");

  } catch (error) {
    console.error("❌ DAILY ROI ERROR:", error);
  }
};


export const getUserROIHistory = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ ROI History (latest first)
    const history = await ROIHistoryModel.find({ userId , type :"daily_roi" })
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      message:"ROI history fetched successfully",
      success: true,
      data:history
    });
  } catch (error) {
    console.error("User ROI Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const getAdminROIHistory = async (req, res) => {
  try {

    // ✅ Latest ROI History
    const history = await ROIHistoryModel.find({type :"daily_roi"})
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      

    return res.status(200).json({
      success: true,
      data:history,

    });
  } catch (error) {
    console.error("Admin ROI Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};