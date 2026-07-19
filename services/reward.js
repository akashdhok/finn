import User from "../models/user.model.js";
import RewardHistory from "../models/rewardHistory.model.js"
export const REWARD_CONFIG = [
  { rank: "L1", powerLeg: 12500, weakerBusiness: 12500, instantReward: 400, dailyReward: 4 },
  { rank: "L2", powerLeg: 25000, weakerBusiness: 25000, instantReward: 1000, dailyReward: 10 },
  { rank: "L3", powerLeg: 50000, weakerBusiness: 50000, instantReward: 2000, dailyReward: 22 },
  { rank: "L4", powerLeg: 125000, weakerBusiness: 125000, instantReward: 6000, dailyReward: 50 },
  { rank: "L5", powerLeg: 250000, weakerBusiness: 250000, instantReward: 12000, dailyReward: 110 },
  { rank: "L6", powerLeg: 750000, weakerBusiness: 750000, instantReward: 35000, dailyReward: 350 },
  { rank: "L7", powerLeg: 2000000, weakerBusiness: 2000000, instantReward: 110000, dailyReward: 1100 },
  { rank: "L8", powerLeg: 5000000, weakerBusiness: 5000000, instantReward: 250000, dailyReward: 2500 },
  { rank: "L9", powerLeg: 12500000, weakerBusiness: 12500000, instantReward: 700000, dailyReward: 7000 },
  { rank: "L10", powerLeg: 25000000, weakerBusiness: 25000000, instantReward: 1500000, dailyReward: 15000 },
];



export const checkRewardQualification = async (userId) => {
  try {
    const user = await User.findById(userId).populate("myReferrals");

    if (!user || user.myReferrals.length === 0) return;

    // Har direct referral ka business
    const businesses = [];

    for (const member of user.myReferrals) {
      const referral = await User.findById(member._id);

      businesses.push(referral.teamInvestment || 0);
    }

    if (!businesses.length) return;

    // Highest Leg
    const powerLegBusiness = Math.max(...businesses);

    // Remaining Legs
    const weakerBusiness =
      businesses.reduce((sum, item) => sum + item, 0) - powerLegBusiness;

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

        user.rewardRank = reward.rank;

        user.rewardIncome += reward.instantReward;

        user.totalEarnings += reward.instantReward;

        user.todayEarnings += reward.instantReward;

        await user.save();

        await RewardHistory.create({
          userId: user._id,
          rank: reward.rank,
          powerLegBusiness,
          weakerBusiness,
          instantReward: reward.instantReward,
          dailyReward: reward.dailyReward,
          isActive: true,
        });

        console.log(
          `✅ ${user.username} achieved ${reward.rank}`
        );
      }
    }
  } catch (err) {
    console.log(err);
  }
};