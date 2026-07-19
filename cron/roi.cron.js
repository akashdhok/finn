import cron from "node-cron";
import { distributeDailyROI } from "../services/dailyRoi.js";

// ✅ Daily 12 AM
cron.schedule("0 0 * * *", async () => {
  console.log("⏰ Cron Started: Daily ROI");

  await distributeDailyROI();
});