import User from "../models/user.model.js";
import RewardHistory from "../models/rewardHistory.model.js"
import LeadershipBonusHistory from "../models/leadershipBonusHistory.model.js";
import { checkWorkingCap } from "../helper/capping.js";
export const REWARD_CONFIG = [
  {
    rank: "Bronze Builder",
    powerLeg: 12500,
    weakerBusiness: 12500,
    instantReward: 400,
  },
  {
    rank: "Silver Starter",
    powerLeg: 25000,
    weakerBusiness: 25000,
    instantReward: 1000,
  },
  {
    rank: "Gold Achiever",
    powerLeg: 50000,
    weakerBusiness: 50000,
    instantReward: 2000,
  },
  {
    rank: "Platinum Producer",
    powerLeg: 125000,
    weakerBusiness: 125000,
    instantReward: 6000,
  },
  {
    rank: "Diamond Director",
    powerLeg: 250000,
    weakerBusiness: 250000,
    instantReward: 12000,
  },
  {
    rank: "Elite Executive",
    powerLeg: 750000,
    weakerBusiness: 750000,
    instantReward: 35000,
  },
  {
    rank: "Master Mentor",
    powerLeg: 2000000,
    weakerBusiness: 2000000,
    instantReward: 110000,
  },
  {
    rank: "Legend Leader",
    powerLeg: 5000000,
    weakerBusiness: 5000000,
    instantReward: 250000,
  },
  {
    rank: "Champion Creator",
    powerLeg: 12500000,
    weakerBusiness: 12500000,
    instantReward: 700000,
  },
  {
    rank: "Crown Conqueror",
    powerLeg: 25000000,
    weakerBusiness: 25000000,
    instantReward: 1500000,
  },
];


export const LEADERSHIP_BONUS = {
  "Bronze Builder": {
    dailyIncome: 4,
  },
  "Silver Starter": {
    dailyIncome: 10,
  },
  "Gold Achiever": {
    dailyIncome: 22,
  },
  "Platinum Producer": {
    dailyIncome: 50,
  },
  "Diamond Director": {
    dailyIncome: 110,
  },
  "Elite Executive": {
    dailyIncome: 350,
  },
  "Master Mentor": {
    dailyIncome: 1100,
  },
  "Legend Leader": {
    dailyIncome: 2500,
  },
  "Champion Creator": {
    dailyIncome: 7000,
  },
  "Crown Conqueror": {
    dailyIncome: 15000,
  },
};

export const checkRewardQualification = async (userId) => {
  try {
    const user = await User.findById(userId).populate("myReferrals");

    if (!user || user.myReferrals.length === 0) return;

    const businesses = [];

    for (const member of user.myReferrals) {
      const referral = await User.findById(member._id);

      businesses.push(Number(referral.teamInvestment || 0));
    }

    if (!businesses.length) return;

    const powerLegBusiness = Math.max(...businesses);

    const weakerBusiness =
      businesses.reduce((sum, value) => sum + value, 0) - powerLegBusiness;

    for (const reward of REWARD_CONFIG) {
      const already = await RewardHistory.findOne({
        userId: user._id,
        rank: reward.rank,
      });

      if (already) continue;

      if (
        powerLegBusiness >= reward.powerLeg &&
        weakerBusiness >= reward.weakerBusiness
      ) {
        // Working Cap
        const cap = checkWorkingCap(user);

        if (cap.isCapReached) {
          console.log(`${user.username} Working Cap Reached`);
          return;
        }

        // Instant Reward according to remaining cap
        const payable = Math.min(
          reward.instantReward,
          cap.remainingCap
        );

        user.rewardRank = reward.rank;
        user.rewardIncome += payable;
        user.workingIncome += payable;
        user.totalEarnings += payable;
        user.todayEarnings += payable;

        await user.save();

        await RewardHistory.create({
          userId: user._id,
          rank: reward.rank,
          powerLegBusiness,
          weakerBusiness,
          instantReward: payable,
          isActive: true,
        });

        // Leadership Bonus Start
        const leadership = LEADERSHIP_BONUS[reward.rank];

        if (leadership) {
          const exists = await LeadershipBonusHistory.findOne({
            userId: user._id,
            rank: reward.rank,
          });

          if (!exists) {
            const nextPaymentDate = new Date();
            nextPaymentDate.setDate(nextPaymentDate.getDate() + 1);

            await LeadershipBonusHistory.create({
              userId: user._id,
              rank: reward.rank,
              dailyIncome: leadership.dailyIncome,
              totalPaid: 0,
              nextPaymentDate,
              completed: false,
            });
          }
        }

        console.log(
          `✅ ${user.username} achieved ${reward.rank}`
        );
      }
    }
  } catch (err) {
    console.error("Reward Qualification Error:", err);
  }
};


export const getMyRewardHistory = async (req, res) => {
  try {
    const rewards = await RewardHistory.find({
      userId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rewards.length,
      data: rewards,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


export const getAllRewardHistory = async (req, res) => {
  try {
    const rewards = await RewardHistory.find()
      .populate(
        "userId",
        "username name email mobile rewardRank teamInvestment"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: rewards.length,
      data: rewards,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};