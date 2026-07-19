import User from "../models/user.model.js";

export const updateTeamInvestment = async (userId, amount) => {
  try {
    let currentUser = await User.findById(userId);

    if (!currentUser) return;

    let upline = currentUser.sponsorId;

    while (upline) {
      const uplineUser = await User.findById(upline);

      if (!uplineUser) break;

      uplineUser.teamInvestment += amount;

      await uplineUser.save();

      console.log(
        `✅ ₹${amount} added to ${uplineUser.referralCode} teamInvestment`
      );

      upline = uplineUser.sponsorId;
    }
  } catch (error) {
    console.error("❌ Team investment error:", error);
  }
};