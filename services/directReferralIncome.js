import { checkWorkingCap } from "../helper/capping.js";
import PercentageModel from "../models/percentage.model.js";
import ReferralIncome from "../models/referral.model.js";
import ReferralHistory from "../models/referralHistory.model.js";
import User from "../models/user.model.js";


const REFERRAL_PERCENTAGES = [5, 2, 1, 1, 1];

export const distributeReferralIncome = async (
  userId,
  investmentAmount
) => {
  try {
    let currentUser = await User.findById(userId);

    if (!currentUser) return;

    for (let level = 0; level < REFERRAL_PERCENTAGES.length; level++) {
      if (!currentUser.sponsorId) break;

      const sponsor = await User.findById(currentUser.sponsorId);

      if (!sponsor) break;

      // Working Cap
      const cap = checkWorkingCap(sponsor);

      if (cap.isCapReached) {
        currentUser = sponsor;
        continue;
      }

      const percentage = REFERRAL_PERCENTAGES[level];

      let income = (investmentAmount * percentage) / 100;

      // Remaining Cap
      income = Math.min(income, cap.remainingCap);

      if (income <= 0) {
        currentUser = sponsor;
        continue;
      }

      let wallet = await ReferralIncome.findOne({
        userId: sponsor._id,
      });

      if (!wallet) {
        wallet = await ReferralIncome.create({
          userId: sponsor._id,
          totalIncome: income,
          todayIncome: income,
          lastIncomeDate: new Date(),
        });
      } else {
        wallet.totalIncome += income;
        wallet.todayIncome += income;
        wallet.lastIncomeDate = new Date();

        await wallet.save();
      }

      sponsor.workingIncome += income;
      sponsor.referralIncome +=income;
      sponsor.totalEarnings += income;
      sponsor.todayEarnings += income;

      await sponsor.save();

      await ReferralHistory.create({
        userId: sponsor._id,
        fromUserId: userId,
        amount: income,
        investment: investmentAmount,
        percentage,
        level: level + 1,
      });

      console.log(
        `✅ Level ${level + 1} Referral Income ${income} distributed to ${sponsor.username}`
      );

      // Next Level
      currentUser = sponsor;
    }
  } catch (error) {
    console.error("Referral Distribution Error:", error);
  }
};


export const getUserReferralHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const history = await ReferralHistory.find({ userId })
      .populate("fromUserId", "name email")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      success: true,
      data:history
    });
  } catch (error) {
    console.error("User Referral Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAdminReferralHistory = async (req, res) => {
  try {

    const history = await ReferralHistory.find()
      .populate("userId", "name email")
      .populate("fromUserId", "name email")
      .sort({ createdAt: -1 })

    return res.status(200).json({
      success: true,
      data:history
    });
  } catch (error) {
    console.error("Admin Referral Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};