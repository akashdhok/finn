import Admin from "../models/admin.model.js";
import Support from "../models/contact.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Settings from "../models/setting.model.js"
import Withdrawal from "../models/withdrawal.model.js"
import { updateTeamInvestment } from "../utils/updateTeamInvestment.js"
import PercentageModel from "../models/percentage.model.js";
import Investment from "../models/investment.model.js";
import ROIHistoryModel from "../models/roi.model.js";
import ReferralHistory from "../models/referralHistory.model.js";
import adminPercentage from "../models/adminPercentage.model.js";
import UsdtTokenRate from "../models/setToken.model.js";
import { distributeReferralIncome } from "../services/directReferralIncome.js";
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    const user = await Admin.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        message: "User not found",
        success: false,
      });
    }

    const matchPassword = await bcrypt.compare(password, user.password);
    if (!matchPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
        success: false,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res
      .cookie("token", token, {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
      })
      .status(200)
      .json({
        success: true,
        token,
        data: {
          _id: user._id,
          email: user.email,
          walletAddress: user.walletAddress,
        },
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: error.message || "Server error",
      success: false,
    });
  }
};


export const getAllMessage = async (req, res) => {
  try {
    const allTickets = await Support.find({}).sort({ createdAt: -1 });
    if (!allTickets) {
      return res.status(200).json({
        messae: "No Tickets Founds",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All Tickets Fetched",
      success: false,
      data: allTickets,
    });
  } catch (error) { }
};

export const ticketApprove = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        message: "Ticket Id && message are required",
        success: false,
      });
    }

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        success: false,
      });
    }

    ticket.status = "Approved";
    ticket.response = message;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket Approved Successfully",
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const ticketReject = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({
        message: "Ticket Id  & message are required",
        success: false,
      });
    }

    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found",
        success: false,
      });
    }

    ticket.status = "Rejected";
    ticket.response = message;
    await ticket.save();

    return res.status(200).json({
      message: "Ticket Rejected Successfully",
      success: true,
      data: ticket,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};


export const getAllQuery = async (req, res) => {
  try {
    let data = await Support.find().populate("userId", "name email mobile username")

    if (!data || data.length == 0) {
      return res.status(200).json({ message: "No query found", success: true })
    }
    return res.status(200).json({ message: "No query found", data: data, success: true })

  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error, success: false })

  }
}

export const allUsers = async (req, res) => {
  try {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({
        message: "Unauthorized",
        success: false,
      });
    }

    const users = await User.find();
    if (!users || users.length === 0) {
      return res.status(200).json({
        message: "No users found",
        data: [],
        success: true,
      });
    }

    return res.status(200).json({
      message: "All Users",
      data: users,
      success: true,
    });
  } catch (error) {
    console.error("Error in allUsers:", error);
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const getTotalInvestedUsers = async (_, res) => {
  try {
    const allInvestUsers = await Investment.find({}).populate("userId", 'name email mobile username profilePhoto');

    if (!allInvestUsers) {
      return res.status(200).json({
        message: "No Invested Users",
        success: false,
      });
    }

    return res.status(200).json({
      message: "All Invested Users",
      success: false,
      data: allInvestUsers,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "server error",
      success: false,
    });
  }
};

export const updateGlobalLimit = async (req, res) => {
  const { newLimit } = req.body;

  if (!newLimit || isNaN(newLimit)) {
    return res.status(400).json({ message: "Invalid limit" });
  }

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ withdrawalLimit: newLimit });
    } else {
      settings.withdrawalLimit = newLimit;
      await settings.save();
    }

    res.json({ message: "Global withdrawal limit updated", success: true });
  } catch (err) {
    res.status(500).json({ message: "Failed to update", error: err.message });
  }
};

export const allWithdrwal = async (req, res) => {
  try {
    const userId = req.admin._id;
    if (!userId) {
      return res.status(400).json({
        messae: "Please Login First",
        success: false,
      });
    }

    const allWithdrwals = await Withdrawal.find({}).populate("userId");
    if (!allWithdrwals) {
      return res.status(200).json({
        message: "No Withdrwal Founds",
        success: false,
      });
    }
    return res.status(200).json({
      message: "All withdrwal fetched",
      success: true,
      data: allWithdrwals,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.messae || "Server Error",
      success: false,
    });
  }
};

export const toggleUserBlockStatus = async (req, res) => {
  try {
    const { userId, block } = req.body;
    console.log(req.body, "toggleUserBlockStatus");

    if (!userId || typeof block !== "boolean") {
      return res.status(400).json({
        message: "User ID and block status (true/false) are required",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    user.loginBlocked = block;
    user.loginBlockedDate = new Date();
    await user.save();

    return res.status(200).json({
      message: `User ${block ? "blocked" : "unblocked"} successfully`,
      success: true,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const toggleUserWithdrawalBlock = async (req, res) => {
  try {
    const { userId, block } = req.body;

    if (!userId || typeof block !== "boolean") {
      return res.status(400).json({
        message: "User ID and block (true/false) are required",
        success: false,
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    user.withdrawalBlock = block;
    await user.save();

    return res.status(200).json({
      message: `User withdrawal ${block ? "blocked" : "unblocked"} successfully`,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
};

export const updatePrivateKey = async (req, res) => {
  try {
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: "Private key is required",
      });
    }
    const admin = await Admin.findOne();

    admin.privateKey = privateKey;
    await admin.save();
    return res.status(200).json({
      success: true,
      message: "Private key updated successfully",
    });
  } catch (error) {
    console.error("Error in updatePrivateKey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getPrivateKey = async (req, res) => {
  try {
    const admin = await Admin.findOne();

    if (!admin || !admin.privateKey) {
      return res.status(404).json({
        success: false,
        message: "Private key not found",
      });
    }

    return res.status(200).json({
      success: true,
      privateKey: admin.privateKey,
    });
  } catch (error) {
    console.error("Error in getPrivateKey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const updateWalletAddress = async (req, res) => {
  try {
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: "Private key is required",
      });
    }
    const admin = await Admin.findOne();

    admin.walletAddress = privateKey;
    await admin.save();
    return res.status(200).json({
      success: true,
      message: "Wallet Address updated successfully",
    });
  } catch (error) {
    console.error("Error in Wallet Address", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getWalletAddress = async (req, res) => {
  try {
    const admin = await Admin.findOne();

    if (!admin || !admin.walletAddress) {
      return res.status(404).json({
        success: false,
        message: "Private key not found",
      });
    }

    return res.status(200).json({
      success: true,
      privateKey: admin.walletAddress,
    });
  } catch (error) {
    console.error("Error in getPrivateKey:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const activateUserByAdmin = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    console.log(req.body)

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: "UserId and amount required",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status === true) {
      return res.status(400).json({
        success: false,
        message: "User already active",
      });
    }

    user.status = true;
    user.activeDate = new Date();

    user.myInvestment += Number(amount);

    await user.save();

    await updateTeamInvestment(user._id, amount);


    return res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Activate User Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const setPercentage = async (req, res) => {
  try {
    const { referralPercentage, roiPercentage, roiOnRoi } = req.body;

    // ===============================
    // ✅ VALIDATION
    // ===============================
    if (
      referralPercentage == null ||
      roiPercentage == null ||
      !roiOnRoi
    ) {
      return res.status(400).json({
        success: false,
        message: "All percentage fields are required",
      });
    }

    // ✅ ROI ON ROI VALIDATION
    const { level1, level2, level3, level4, level5 } = roiOnRoi;

    if (
      level1 == null ||
      level2 == null ||
      level3 == null ||
      level4 == null ||
      level5 == null
    ) {
      return res.status(400).json({
        success: false,
        message: "All ROI on ROI levels are required",
      });
    }

    // ===============================
    // 🔥 FIND EXISTING CONFIG
    // ===============================
    let percentage = await PercentageModel.findOne();

    if (!percentage) {
      // 🆕 CREATE
      percentage = await PercentageModel.create({
        referralPercentage,
        roiPercentage,
        roiOnRoi,
      });
    } else {
      // 🔄 UPDATE
      percentage.referralPercentage = referralPercentage;
      percentage.roiPercentage = roiPercentage;
      percentage.roiOnRoi = roiOnRoi;

      await percentage.save();
    }

    return res.status(200).json({
      success: true,
      message: "Percentage updated successfully",
      data: percentage,
    });

  } catch (error) {
    console.error("❌ SET PERCENTAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const getPercentage = async (req, res) => {
  try {
    const percentage = await PercentageModel.findOne();

    if (!percentage) {
      return res.status(404).json({
        success: false,
        message: "Percentage not set yet",
      });
    }

    return res.status(200).json({
      success: true,
      data: percentage,
    });

  } catch (error) {
    console.error("GET PERCENTAGE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const getAdminDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ================= PARALLEL EXECUTION =================
    const [
      totalUsers,
      activeUsers,
      todayUsers,

      totalInvestmentData,
      totalPayoutData,
      totalROIData,
      todayROIData,
      totalReferralData,
      todayReferralData,
      teamBusinessData,
      totalEarningsData,

      recentUsers,
    ] = await Promise.all([

      // USERS
      User.countDocuments(),
      User.countDocuments({ status: true }),
      User.countDocuments({ createdAt: { $gte: today } }),

      // INVESTMENT
      User.aggregate([
        { $group: { _id: null, total: { $sum: "$myInvestment" } } },
      ]),

      // PAYOUT
      User.aggregate([
        { $group: { _id: null, total: { $sum: "$totalWithdrawals" } } },
      ]),

      // ROI
      ROIHistoryModel.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      ROIHistoryModel.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // REFERRAL
      ReferralHistory.aggregate([
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      ReferralHistory.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // TEAM BUSINESS
      User.aggregate([
        { $group: { _id: null, total: { $sum: "$teamInvestment" } } },
      ]),

      // TOTAL EARNINGS
      User.aggregate([
        { $group: { _id: null, total: { $sum: "$totalEarnings" } } },
      ]),

      // RECENT USERS (✅ PROFILE PHOTO INCLUDED)
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email profilePhoto myInvestment createdAt"),
    ]);

    // ================= EXTRACT VALUES =================
    const totalInvestment = totalInvestmentData[0]?.total || 0;
    const totalPayout = totalPayoutData[0]?.total || 0;
    const totalROI = totalROIData[0]?.total || 0;
    const todayROI = todayROIData[0]?.total || 0;
    const totalReferral = totalReferralData[0]?.total || 0;
    const todayReferral = todayReferralData[0]?.total || 0;
    const totalTeamBusiness = teamBusinessData[0]?.total || 0;
    const totalEarnings = totalEarningsData[0]?.total || 0;

    // ================= FORMAT RECENT USERS =================
    const formattedUsers = recentUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePhoto: user.profilePhoto || null,
      myInvestment: user.myInvestment || 0,
      createdAt: user.createdAt,
    }));

    // ================= RESPONSE =================
    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalUsersToday: todayUsers,
        totalInvestment,
        totalPayout,
        totalROI,
        todayROI,
        totalReferral,
        todayReferral,
        totalTeamBusiness,
        totalEarnings,
        recentUsers: formattedUsers,
      },
    });

  } catch (error) {
    console.error("Admin Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const createOrUpdateAdminPercentage = async (req, res) => {
  try {
    const { tokenPercentage, usdtPercentage } = req.body;

    if (tokenPercentage == null || usdtPercentage == null) {
      return res.status(400).json({
        success: false,
        message: "Both tokenPercentage and usdtPercentage are required",
      });
    }

    // ================= FIND EXISTING =================
    let data = await adminPercentage.findOne();

    if (data) {
      // UPDATE
      data.tokenPercentage = tokenPercentage;
      data.usdtPercentage = usdtPercentage;
      await data.save();

      return res.status(200).json({
        success: true,
        message: "Admin percentage updated successfully",
        data,
      });
    }

    // CREATE
    data = await adminPercentage.create({
      tokenPercentage,
      usdtPercentage,
    });

    res.status(201).json({
      success: true,
      message: "Admin percentage created successfully",
      data,
    });

  } catch (error) {
    console.error("Admin Percentage Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// @desc Get Admin Percentage
// @route GET /api/admin-percentage
export const getAdminPercentage = async (req, res) => {
  try {
    const data = await adminPercentage.findOne();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No data found",
      });
    }

    res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



export const upsertUsdtRate = async (req, res) => {
  try {
    const { rate, usdt } = req.body;

    if (!rate || rate <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid rate required",
      });
    }

    let data = await UsdtTokenRate.findOne();

    if (data) {
      data.rate = rate;
      data.usdt = usdt || data.usdt || 1;
      await data.save();

      return res.json({
        success: true,
        message: "Rate updated successfully",
        data,
      });
    }

    const newRate = await UsdtTokenRate.create({ rate });

    res.json({
      success: true,
      message: "Rate created successfully",
      data: newRate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUsdtRate = async (req, res) => {
  try {
    const data = await UsdtTokenRate.findOne();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Rate not set yet",
      });
    }

    res.json({
      success: true,
      rate: data.rate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


export const addWalletAddress = async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address is required",
      });
    }

    const admin = await Admin.findOne();

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    admin.walletAddress = walletAddress;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Wallet address updated successfully",
      data: admin,
    });

  } catch (error) {
    console.error("Add Wallet Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const adminWalletAddress = async (req, res) => {
  try {
    const admin = await Admin.findOne();

    if (!admin || !admin.walletAddress) {
      return res.status(404).json({
        success: false,
        message: "Wallet address not found",
      });
    }

    return res.status(200).json({
      success: true,
      walletAddress: admin.walletAddress,
    });
  } catch (error) {
    console.error("Get Wallet Address Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const addInvestmentManually = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const investment = await Investment.create({
      userId: user._id,
      investmentAmount: Number(amount),
      investmentDate: new Date(),

      txResponse: `ADMIN-${Date.now()}`,
      txHash: `ADMIN-${Date.now()}`,
      paymentMethod: "ADMIN",
      status: "SUCCESS",
      remark: "Investment added manually by admin",
    });
    user.investments.push(investment._id);
    user.myInvestment += Number(amount);
    user.todayInvestment += Number(amount);
    user.activeDate = new Date();
    user.status = true;
    user.isVerified = true;

    await user.save();
    await updateTeamInvestment(user._id, Number(amount));
    await distributeReferralIncome(user._id, Number(amount));

    // Investment History Create


    return res.status(200).json({
      success: true,
      message: "Investment added successfully",
      investment,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};