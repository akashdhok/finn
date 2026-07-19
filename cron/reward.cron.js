import cron from "node-cron";
import User from "../models/user.model.js";
import { checkRewardQualification } from "../services/reward.js";


export const rewardQualificationCron = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("🏆 Reward Qualification Cron Started...");

      const users = await User.find({
        status: true,
      }).select("_id");

      for (const user of users) {
        try {
          await checkRewardQualification(user._id);
        } catch (err) {
          console.error(`Reward Error (${user._id}):`, err.message);
        }
      }

      console.log("✅ Reward Qualification Cron Completed");
    } catch (err) {
      console.error("❌ Reward Cron Error:", err);
    }
  });
};