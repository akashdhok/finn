import PercentageModel from "../models/percentage.model.js";
import ReferralIncome from "../models/referral.model.js";
import ReferralHistory from "../models/referralHistory.model.js";
import User from "../models/user.model.js";

export const distributeReferralIncome = async (userId, investmentAmount) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.sponsorId) return;

    const sponsor = await User.findById(user.sponsorId);
    if (!sponsor) return;

    const percentageData = await PercentageModel.findOne();
    if (!percentageData) return;

    const percent = percentageData.referralPercentage;

    const income = (investmentAmount * percent) / 100;
    if (income <= 0) return;

    let referralWallet = await ReferralIncome.findOne({ userId: sponsor._id });

    if (!referralWallet) {
      referralWallet = await ReferralIncome.create({
        userId: sponsor._id,
        totalIncome: income,
        todayIncome: income,
        lastIncomeDate: new Date(),
      });
    } else {
      referralWallet.totalIncome += income;
      referralWallet.todayIncome += income;
      referralWallet.lastIncomeDate = new Date();
      await referralWallet.save();
    }

    sponsor.totalEarnings += income;
    sponsor.todayEarnings += income;
    await sponsor.save();

    await ReferralHistory.create({
      userId: sponsor._id,
      fromUserId: user._id,
      amount: income,
      investment: investmentAmount,
      percentage: percent,
      level: 1,
    });

    console.log("✅ Referral Income Distributed");

  } catch (error) {
    console.error("❌ REFERRAL ERROR:", error);
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