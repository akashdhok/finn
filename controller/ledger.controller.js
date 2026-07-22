import User from "../models/user.model.js";
import Investment from "../models/investment.model.js";
import os from "os";
import ROIHistory from "../models/roi.model.js";
import ReferralHistory from "../models/referralHistory.model.js";
import RewardHistory from "../models/rewardHistory.model.js";
import LeadershipBonus from "../models/leadershipBonusHistory.model.js";

export const getBlockchainDashboard = async (req, res) => {
  try {
    const { hash } = req.params;

    const user = await User.findOne({
      blockchainHash: hash,
    }).populate("investments");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Blockchain address not found",
      });
    }

    const totalInvestment = Number(user.myInvestment || 0);
    const totalPackages = user.investments?.length || 0;

    const totalROI = Number(user.totalROI || 0);
    const roiOnroi = Number(user.roiOnroiIncome || 0);
    const referralIncome = Number(user.referralIncome || 0);
    const totalReward = Number(user.rewardIncome || 0);
    const leadershipBonus = Number(user.leadershipBonusIncome || 0);
    const workingIncome = Number(user.workingIncome || 0);

    const totalIncome =
      totalROI +
      roiOnroi +
      referralIncome +
      totalReward +
      leadershipBonus +
      workingIncome;

    const totalWithdraw = Number(user.totalWithdrawals || 0);
    const totalReferrals = Number(user.referralCount || 0);
    const teamBusiness = Number(user.teamInvestment || 0);

    return res.status(200).json({
      success: true,
      data: {
        // Blockchain
        blockchainHash: user.blockchainHash,
        walletAddress: user.walletAddress || null,

        // User Info
        username: user.username,
        name: user.name,
        email: user.email,
        joinedOn: user.createdAt,
        activeDate: user.activeDate,
        active: user.status,

        // Rank
        rewardRank: user.rewardRank,

        // Business
        totalPackages,
        totalInvestment,
        teamBusiness,
        totalReferrals,

        // Income
        totalROIIncome: totalROI,
        roiOnRoiIncome: roiOnroi,
        referralIncome,
        rewardIncome: totalReward,
        leadershipBonusIncome: leadershipBonus,
        workingIncome,

        // Summary
        totalIncome,
        totalWithdraw,
        netBalance: totalIncome - totalWithdraw,

        // Other
        isVerified: user.isVerified,
        withdrawalBlocked: user.withdrawalBlock,
        loginBlocked: user.loginBlocked,
      },
    });
  } catch (error) {
    console.error("Blockchain Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
export const getBlockchainPublicStats = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      investmentResult,
      businessResult,
      earningsResult,
      withdrawResult,
      todayUsers,
      verifiedUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: true }),
      User.countDocuments({ status: false }),

      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$myInvestment" },
          },
        },
      ]),

      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$teamInvestment" },
          },
        },
      ]),

      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$totalEarnings" },
          },
        },
      ]),

      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$totalWithdrawals" },
          },
        },
      ]),

      User.countDocuments({
        createdAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      }),

      User.countDocuments({
        isVerified: true,
      }),
    ]);

    const totalInvestment = investmentResult[0]?.total || 0;
    const totalBusiness = businessResult[0]?.total || 0;
    const totalIncome = earningsResult[0]?.total || 0;
    const totalWithdraw = withdrawResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: {
        // Network
        networkName: "Finaster Mainnet",
        chainId: 1001,
        currency: "USDT",
        consensus: "Proof of Stake",
        status: "ONLINE",

        // Users
        totalUsers,
        activeUsers,
        inactiveUsers,
        verifiedUsers,
        todayRegistrations: todayUsers,

        // Business
        totalInvestment,
        totalBusiness,

        // Income
        totalIncomeDistributed: totalIncome,
        totalWithdrawals: totalWithdraw,
        totalBalanceInSystem: totalIncome - totalWithdraw,

        // Server
        serverRegion:
          process.env.SERVER_REGION || "India (Mumbai)",

        nodeVersion: process.version,
        serverOS: `${os.type()} ${os.release()}`,
        uptime: Math.floor(process.uptime()),

        // Time
        serverTime: new Date(),
        lastUpdated: new Date(),
      },
    });
  } catch (error) {
    console.error("Blockchain Stats Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getNetworkStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const activeUsers = await User.countDocuments({
      status: true,
    });

    const totalInvestment = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$myInvestment" },
        },
      },
    ]);

    const totalBusiness = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$teamInvestment" },
        },
      },
    ]);

    const totalIncome = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalEarnings" },
        },
      },
    ]);

    const totalWithdraw = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalWithdrawals" },
        },
      },
    ]);

    // Today Registered Users
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayUsers = await User.countDocuments({
      createdAt: { $gte: today },
    });

    // Current UTC Time
    const blockTime = new Date().toISOString();

    return res.status(200).json({
      success: true,
      data: {
        networkName: "Finaster Mainnet",

        chainId: 1001,

        serverRegion:
          process.env.SERVER_REGION || "India (Mumbai)",

        protocol: "Ethereum Compatible",

        consensus: "Proof of Stake",

        currency: "USDT",

        totalUsers,

        activeUsers,

        todayUsers,

        totalInvestment:
          totalInvestment[0]?.total || 0,

        totalBusiness:
          totalBusiness[0]?.total || 0,

        totalIncomeDistributed:
          totalIncome[0]?.total || 0,

        totalWithdrawals:
          totalWithdraw[0]?.total || 0,

        latestBlockTime: blockTime,

        serverTime: new Date(),

        apiVersion: "v1.0.0",

        nodeVersion: process.version,

        serverOS: `${os.type()} ${os.release()}`,

        uptime: Math.floor(process.uptime()),

        status: "ONLINE",
      },
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const getRecentIncomeHistories = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(userId)

    const [
      roiHistory,
      referralHistory,
      rewardHistory,
      leadershipHistory,
    ] = await Promise.all([
      ROIHistory.find({ userId })
        .populate("fromUser", "name username blockchainHash")
        .sort({ createdAt: -1 })
        .limit(5),

      ReferralHistory.find({ userId })
        .populate("fromUserId", "name username blockchainHash")
        .sort({ createdAt: -1 })
        .limit(5),

      RewardHistory.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5),

      LeadershipBonus.find({
        userId,
        completed: false,
      })
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        roiHistory,
        referralHistory,
        rewardHistory,
        leadershipHistory,
      },
    });
  } catch (error) {
    console.error("Recent Income Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


export const getSystemRecentIncomeHistory = async (req, res) => {
  try {
    const [
      roiHistory,
      referralHistory,
      rewardHistory,
      leadershipHistory,
    ] = await Promise.all([
      ROIHistory.find()
        .populate("userId", "name username blockchainHash")
        .populate("fromUser", "name username blockchainHash")
        .sort({ createdAt: -1 })
        .limit(10),

      ReferralHistory.find()
        .populate("userId", "name username blockchainHash")
        .populate("fromUserId", "name username blockchainHash")
        .sort({ createdAt: -1 })
        .limit(10),

      RewardHistory.find()
        .populate("userId", "name username blockchainHash")
        .sort({ createdAt: -1 })
        .limit(10),

      LeadershipBonus.find()
        .populate("userId", "name username blockchainHash")
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        roiHistory,
        referralHistory,
        rewardHistory,
        leadershipHistory,
      },
    });
  } catch (error) {
    console.error("System Income History Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};