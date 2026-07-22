import cron from "node-cron";
import { distributeLeadershipBonus } from "../services/leadership.js";

cron.schedule("0 0 * * *", async () => {
  console.log("Leadership Bonus Cron Started");

  await distributeLeadershipBonus();

  console.log("Leadership Bonus Cron Completed");
});