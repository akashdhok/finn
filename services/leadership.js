import User from "../models/user.model.js";
import LeadershipBonusHistory from "../models/leadershipBonusHistory.model.js";
import { checkWorkingCap } from "../helper/capping.js";

export const distributeLeadershipBonus = async () => {
  try {
    const today = new Date();

    const bonuses = await LeadershipBonusHistory.find({
      completed: false,
      nextPaymentDate: { $lte: today },
    });

    for (const bonus of bonuses) {
      try {
        const user = await User.findById(bonus.userId);

        if (!user) continue;

        // Working Cap Check
        const cap = checkWorkingCap(user);

        if (cap.isCapReached) {
          bonus.completed = true;
          await bonus.save();
          continue;
        }

        // Remaining Cap
        const payable = Math.min(
          bonus.dailyIncome,
          cap.remainingCap
        );

        if (payable <= 0) {
          bonus.completed = true;
          await bonus.save();
          continue;
        }

        // Income Credit
        user.leadershipBonusIncome += payable;
        user.workingIncome += payable;
        user.totalEarnings += payable;
        user.todayEarnings += payable;

        await user.save();

        // History Update
        bonus.totalPaid += payable;

        // Next Payment Tomorrow
        const nextDate = new Date(bonus.nextPaymentDate);
        nextDate.setDate(nextDate.getDate() + 1);

        bonus.nextPaymentDate = nextDate;

        // If Cap Finished After Payment
        const latestCap = checkWorkingCap(user);

        if (latestCap.isCapReached) {
          bonus.completed = true;
        }

        await bonus.save();

        console.log(
          `Leadership Bonus ${payable} distributed to ${user.username}`
        );
      } catch (err) {
        console.log(err);
      }
    }

    console.log("Leadership Bonus Cron Completed");
  } catch (err) {
    console.log(err);
  }
};


export const getMyLeadershipBonus = async (req, res) => {
  try {
    const userId = req.user._id;

    const bonuses = await LeadershipBonusHistory.find({
      userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bonuses.length,
      data: bonuses,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};


export const getAllLeadershipBonus = async (req, res) => {
  try {
    const bonuses = await LeadershipBonusHistory.find()
      .populate("userId", "username name email mobile rewardRank")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bonuses.length,
      data: bonuses,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};