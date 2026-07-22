import PercentageModel from "../models/percentage.model.js";
import User from "../models/user.model.js";
import ROIHistoryModel from "../models/roi.model.js";
import { checkWorkingCap } from "../helper/capping.js";

export const distributeROIOnROI = async (userId, roiAmount) => {
  try {
    const levels = [
      20,
      10,
      8,
      4,
      4,
      4,
      4,
      4,
      5,
      5,
      3,
      3,
      3,
      3,
      3,
    ];

    let currentUser = await User.findById(userId);

    if (!currentUser) return;

    for (let i = 0; i < levels.length; i++) {
      if (!currentUser.sponsorId) break;

      const upline = await User.findById(currentUser.sponsorId);

      if (!upline) break;

      // Active Direct Referrals Count
      const directCount = await User.countDocuments({
        sponsorId: upline._id,
        status: true,
      });

      // Unlock Levels
      const unlockedLevels = Math.min(directCount * 3, 15);

      if (i + 1 > unlockedLevels) {
        console.log(
          `❌ ${upline.username} has only ${directCount} directs. Level ${i + 1} locked.`
        );

        currentUser = upline;
        continue;
      }

      const percent = levels[i];

      if (percent <= 0) {
        currentUser = upline;
        continue;
      }

      // Working Cap Check
      const cap = checkWorkingCap(upline);

      if (cap.isCapReached) {
        console.log(`❌ ${upline.username} Working Cap Reached`);
        currentUser = upline;
        continue;
      }

      let income = (roiAmount * percent) / 100;

      // Remaining Working Cap
      income = Math.min(income, cap.remainingCap);

      if (income <= 0) {
        currentUser = upline;
        continue;
      }

      // Credit Income
      upline.workingIncome += income;
      upline.roiOnroiIncome +=income;
      upline.totalEarnings += income;
      upline.todayEarnings += income;

      await upline.save();

      // History
      await ROIHistoryModel.create({
        userId: upline._id,
        amount: income,
        fromUser: userId,
        level: i + 1,
        percentage: percent,
        type: "roi_on_roi",
      });

      console.log(
        `✅ Level ${i + 1} ROI On ROI: ${income} (${percent}%) -> ${upline.username}`
      );

      currentUser = upline;
    }
  } catch (error) {
    console.error("❌ ROI ON ROI ERROR:", error);
  }
};

export const getMyROIOnROI = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await ROIHistoryModel.find({
      userId,
      type: "roi_on_roi", // ✅ HARDCODE
    })
      .populate("fromUser", "name email")
      .sort({ createdAt: -1 })


    return res.status(200).json({
      success: true,
      data: history,
    });

  } catch (error) {
    console.error("❌ ROI ON ROI ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const getAllROIOnROI = async (req, res) => {
  try {
    const history = await ROIHistoryModel.find({
      type: "roi_on_roi", // ✅ HARDCODE
    })
      .populate("userId", "name email")
      .populate("fromUser", "name email")

    return res.status(200).json({
      success: true,
      data: history,
    });

  } catch (error) {
    console.error("❌ ADMIN ROI ON ROI ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};