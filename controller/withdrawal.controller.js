import {
  JsonRpcProvider,
  Wallet,
  Contract,
  parseUnits,
  isAddress,
} from "ethers";
import dotenv from "dotenv";
import Withdrawal from "../models/withdrawal.model.js";
import Settings from "../models/setting.model.js";
import User from "../models/user.model.js";
import Admin from "../models/admin.model.js";
import { generateOTP, sendOTP } from "../utils/sendOTP.js";
dotenv.config();
const provider = new JsonRpcProvider(
  process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
);
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const NEXO50_ADDRESS =
  process.env.NEXO50_CONTRACT_ADDRESS ||
  "0x58A9996250111af893545a5cf4185E5537c7A4F5";
const NEXO50_DECIMALS = 18;
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address) view returns (uint256)",
];
let cachedWallet = null;
export const getAdminWallet = async () => {
  if (cachedWallet) return cachedWallet;
  const adminSettings = await Admin.findOne();
  if (!adminSettings?.privateKey) {
    throw new Error("Admin private key is not set in the database");
  }

  cachedWallet = new Wallet(adminSettings.privateKey, provider);
  return cachedWallet;
};

export const withdrawalRequest = async (req, res) => {
  try {
    console.log("Processing withdrawal request...");
    const userId = req.user._id;

    const { usdtAmount, tokenAmount, totalUsdtAmount, otp } = req.body;
    console.log("Withdrawal request received:", {
      userId,
      usdtAmount,
      tokenAmount,
      totalUsdtAmount,
      otp,
    });

    if (!otp) {
      return res
        .status(400)
        .json({ error: "Wallet address and OTP are required" });
    }

    const numericUsdtAmount = Number(usdtAmount) || 0;
    const numericTokenAmount = Number(tokenAmount) || 0;
    if (numericUsdtAmount < 0 || numericTokenAmount < 0) {
      return res.status(400).json({ error: "Amount cannot be negative" });
    }
    if (numericUsdtAmount === 0 && numericTokenAmount === 0) {
      return res.status(400).json({ error: "At least one amount is required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    const userWalletAddress = user.walletAddress;
    if (!userWalletAddress || !isAddress(userWalletAddress)) {
      return res.status(400).json({
        message: "Invalid or missing wallet address in user profile",
        success: false,
      });
    }
    if (!isAddress(userWalletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }
    if (user.withdrawalBlock) {
      return res.status(403).json({
        message: "Server busy. Try later.",
        success: false,
      });
    }
    if (user.otp !== otp) {
      return res.status(400).json({
        message: "Invalid OTP",
        success: false,
      });
    }
    if (Date.now() > user.otpExpiresAt) {
      return res.status(400).json({
        message: "OTP expired",
        success: false,
      });
    }
    if (user.currentEarnings < totalUsdtAmount) {
      return res.status(400).json({
        message: "Insufficient balance for withdrawal",
        success: false,
      });
    }
    // const settings = await Settings.findOne();
    // const withdrawalLimit = settings?.withdrawalLimit || 1;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayWithdrawals = await Withdrawal.find({
      userWalletAddress,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // if (todayWithdrawals.length >= withdrawalLimit) {
    //   return res.status(400).json({
    //     message: "Daily withdrawal limit reached",
    //     success: false,
    //   });
    // }

    const todayTotalWithdrawn = todayWithdrawals.reduce(
      (total, tx) => total + tx.amount,
      0,
    );

    // const dailyLimit = user.dailyWithdrawalLimit ?? 50;

    // if (todayTotalWithdrawn + totalAmount > dailyLimit) {
    //   return res.status(400).json({
    //     message: `Daily limit $${dailyLimit} exceeded`,
    //     success: false,
    //   });
    // }

    const feePercentage = 10;
    const wallet = await getAdminWallet();

    let usdtTxHash = null;
    let tokenTxHash = null;
    let usdtNetAmount = 0;
    let tokenNetAmount = 0;
    let usdtFee = 0;
    let tokenFee = 0;

    // ✅ USDT Withdrawal
    if (numericUsdtAmount > 0) {
      usdtFee = (numericUsdtAmount * feePercentage) / 100;
      usdtNetAmount = numericUsdtAmount - usdtFee;
      const usdtWei = parseUnits(usdtNetAmount.toString(), 18);

      const usdtContract = new Contract(USDT_ADDRESS, ERC20_ABI, wallet);
      const usdtBalance = await usdtContract.balanceOf(wallet.address);

      if (usdtBalance < usdtWei) {
        return res.status(400).json({
          success: false,
          message: "Server has insufficient USDT balance",
        });
      }

      const usdtTx = await usdtContract.transfer(userWalletAddress, usdtWei, {
        gasLimit: 210000,
      });
      const usdtReceipt = await usdtTx.wait();

      if (!usdtReceipt.status) {
        return res.status(500).json({
          success: false,
          message: "USDT transfer failed",
        });
      }

      usdtTxHash = usdtReceipt.hash;
    }

    if (numericTokenAmount > 0) {
      tokenFee = (numericTokenAmount * feePercentage) / 100;
      tokenNetAmount = numericTokenAmount - tokenFee;
      const tokenWei = parseUnits(tokenNetAmount.toString(), NEXO50_DECIMALS);

      const tokenContract = new Contract(NEXO50_ADDRESS, ERC20_ABI, wallet);
      const tokenBalance = await tokenContract.balanceOf(wallet.address);

      if (tokenBalance < tokenWei) {
        return res.status(400).json({
          success: false,
          message: "Server has insufficient NEXO50 balance",
        });
      }

      const tokenTx = await tokenContract.transfer(
        userWalletAddress,
        tokenWei,
        {
          gasLimit: 210000,
        },
      );
      const tokenReceipt = await tokenTx.wait();

      if (!tokenReceipt.status) {
        return res.status(500).json({
          success: false,
          message: "NEXO50 transfer failed",
        });
      }

      tokenTxHash = tokenReceipt.hash;
    }

    // ✅ Save withdrawal record
    await Withdrawal.create({
      userId,
      userWalletAddress,
      totalAmount: totalUsdtAmount,
      usdtAmount: numericUsdtAmount,
      tokenAmount: numericTokenAmount,
      usdtFee,
      tokenFee,

      usdtTxHash: usdtTxHash || null,
      tokenTxHash: tokenTxHash || null,
      status: "success",
    });

    // ✅ Deduct balance
    user.currentEarnings -= totalAmount;
    user.totalPayouts += totalAmount;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Withdrawal successful",
      data: {
        usdt:
          numericUsdtAmount > 0
            ? {
                requested: numericUsdtAmount,
                fee: usdtFee,
                netSent: usdtNetAmount,
                txHash: usdtTxHash,
              }
            : null,
        nexo50:
          numericTokenAmount > 0
            ? {
                requested: numericTokenAmount,
                fee: tokenFee,
                netSent: tokenNetAmount,
                txHash: tokenTxHash,
              }
            : null,
        totalDeducted: totalAmount,
      },
    });
  } catch (error) {
    console.error("Withdrawal error:", error);

    return res.status(500).json({
      error: error.message || "Failed to process withdrawal",
      success: false,
    });
  }
};
export const approveWithdrawal = async (req, res) => {
  const { withdrawalId } = req.body;

  if (!withdrawalId) {
    return res
      .status(400)
      .json({ message: "Withdrawal ID is required", success: false });
  }

  try {
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal) {
      return res
        .status(404)
        .json({ message: "Withdrawal not found", success: false });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        message: `Withdrawal is already ${withdrawal.status}`,
        success: false,
      });
    }

    withdrawal.status = "approved";
    withdrawal.transactionHash = "";
    await withdrawal.save();

    return res.status(200).json({
      message: "Withdrawal approved successfully",
      success: true,
    });
  } catch (error) {
    console.error("Approval error:", error.message);
    return res.status(500).json({
      message: "Server error during approval",
      success: false,
    });
  }
};

export const rejectWithdrawal = async (req, res) => {
  const { withdrawalId } = req.body;

  if (!withdrawalId) {
    return res
      .status(400)
      .json({ message: "Withdrawal ID is required", success: false });
  }

  try {
    const withdrawal = await Withdrawal.findById(withdrawalId);

    if (!withdrawal) {
      return res
        .status(404)
        .json({ message: "Withdrawal not found", success: false });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        message: `Withdrawal is already ${withdrawal.status}`,
        success: false,
      });
    }

    withdrawal.status = "rejected";

    const user = await User.findById(withdrawal.userId);
    if (user) {
      user.currentEarnings += withdrawal.amount;
      user.totalPayouts -= withdrawal.amount;
      await user.save();
    }

    await withdrawal.save();

    return res.status(200).json({
      message: "Withdrawal rejected successfully",
      success: true,
    });
  } catch (error) {
    console.error("Rejection error:", error.message);
    return res.status(500).json({
      message: "Server error during rejection",
      success: false,
    });
  }
};

export const sendOtpForWithdrwal = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = Date.now() + 2 * 60 * 1000;
    await user.save();

    await sendOTP(user.email, otp, user.username);

    return res.status(200).json({
      success: true,
      message: `✅ OTP has been sent to your registered email (${user.email}).`,
    });
  } catch (error) {
    console.error("Error in sendOtp:", error);
    return res.status(500).json({
      success: false,
      message: "❌ Internal Server Error",
    });
  }
};

export const withdrawalHistory = async (req, res) => {
  try {
    const userId = req.user;
    console.log(userId);
    const allWithdrwal = await Withdrawal.find({ userId: userId })
      .populate("userId")
      .sort({ createdAt: -1 });
    if (!allWithdrwal) {
      return res.status(200).json({
        message: "No withdrwal History Found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Withdrwal History Fetched",
      success: false,
      data: allWithdrwal,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Server Error",
      success: false,
    });
  }
};

export const getAllWithdrawal = async (req, res) => {
  try {
    let data = await Withdrawal.find().populate(
      "userId",
      "name email mobile username walletaddress",
    );
    if (!data || data.length == 0) {
      return res
        .status(200)
        .json({ message: "No withdrawal record found", success: true });
    }
    return res
      .status(200)
      .json({ message: "withdrawal record found", data: data, success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Internal server error", error, success: false });
  }
};