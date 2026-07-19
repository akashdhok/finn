import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateReferralCode, randomUsername } from "../utils/generateReferralCode.js";
import Investment from "../models/investment.model.js";
import Support from "../models/contact.model.js";
import { distributeReferralIncome } from "../services/directReferralIncome.js";
import { updateTeamInvestment } from "../utils/updateTeamInvestment.js";
import { v4 as uuidv4 } from "uuid";
import ReferralIncome from "../models/referral.model.js";
import { sendNewPassword } from "../utils/sendOTP.js";
export const userRegister = async (req, res) => {
  try {
    const { name, email, password, referredBy } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const referralCode = generateReferralCode();
    const username = randomUsername();

    let sponsorId = null;

    const userCount = await User.countDocuments();

    if (userCount === 0) {
      const newUser = new User({
        name,
        email,
        password: hashedPassword,
        showPassword: password,
        referralCode,
        username,
        sponsorId: null,
      });

      const savedUser = await newUser.save();

      const token = jwt.sign(
        { id: savedUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        token,
        data: savedUser,
      });
    }

    if (!referredBy) {
      return res.status(400).json({
        success: false,
        message: "Referral code is required",
      });
    }

    const sponsorUser = await User.findOne({
      referralCode: referredBy,
    });

    if (!sponsorUser) {
      return res.status(400).json({
        success: false,
        message: "Invalid referral code",
      });
    }

    sponsorId = sponsorUser._id;

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      showPassword: password,
      referralCode,
      username,
      sponsorId,
    });

    const savedUser = await newUser.save();

    await User.findByIdAndUpdate(sponsorId, {
      $push: { myReferrals: savedUser._id },
      
      $inc: { referralCount: 1 },
    });

    const token = jwt.sign(
      { id: savedUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      data: savedUser,
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}; 


export const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Email or Password",
      });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );      

    return res.status(200).json({
      success: true,
      token,
      data: user,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}; 


export const getUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)        
        .populate("myReferrals", "name email mobile referralCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error("PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, mobile } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "Name and Mobile are required",
      });
    }

    const updateData = {
      name,
      mobile,
    };

    if (req.file) {
      updateData.profilePhoto = req.file.path;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const addWalletAddress = async (req, res) => {
  try {
    const userId = req.userId;
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet Address is required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { walletAddress },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedUser,
    });

  } catch (error) {
    console.error("ADD WALLET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }         
};

export const myWalletAddress = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);   

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user.walletAddress,
    });

  } catch (error) {
    console.error("MY WALLET ADDRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


export const getMyReferrals = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId)
        .populate("myReferrals", "name email mobile referralCode");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,   
      data: user.myReferrals,
    });

  } catch (error) {
    console.error("MY REFERRALS ERROR:", error);    
    return res.status(500).json({  success: false, "message": "Server Error" });
    }
};

const getDownlineTree = async (userId) => {
  const user = await User.findById(userId)
    .select("name email referralCode myReferrals");

  if (!user) return null;

  const referrals = await User.find({
    _id: { $in: user.myReferrals },
  });

  const downline = [];

  for (let ref of referrals) {
    const childTree = await getDownlineTree(ref._id);

    downline.push({
      _id: ref._id,
      name: ref.name,
      email: ref.email,
      referralCode: ref.referralCode,
      downline: childTree ? childTree.downline : [],
    });
  }

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    referralCode: user.referralCode,
    downline,
  };
};

export const getMyDownline = async (req, res) => {
  try {
    const userId = req.user._id;

    const tree = await getDownlineTree(userId);

    return res.status(200).json({
      success: true,
      data: tree,
    });

  } catch (error) {
    console.error("DOWNLINE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const investment = async (req, res) => {
  try {
    const { investmentAmount, txResponse } = req.body;
    const userId = req.user._id;

    if (!userId || !investmentAmount || !txResponse) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const existingInvestment = await Investment.findOne({ txResponse });
    if (existingInvestment) {
      return res.status(409).json({
        success: false,
        message: "This transaction has already been processed",
        investment: existingInvestment,
      });
    }

    const investment = await Investment.create({
      userId,
      investmentAmount,
      txResponse,
      investmentDate: new Date(),
    });

    user.investments.push(investment._id);
    user.myInvestment += Number(investmentAmount);
    user.todayInvestment += Number(investmentAmount);
    user.isVerified = true;
    user.status = true;
    user.activeDate = new Date();

    await user.save();
     await updateTeamInvestment(user._id, Number(investmentAmount));
await distributeReferralIncome(user._id, Number(investmentAmount));

    return res.status(201).json({
      success: true,
      message: "Investment successful",
      investment,
    });
  } catch (error) {
    console.error("Error in Investment:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export const myInvestment = async (req, res) => {
  try {
    const userId = req.user._id;

    const data = await Investment.find({ userId }); 

    if (!data || data.length === 0) {
      return res.status(200).json({
        message: "No investment found",
        success: true,
        data: [],
      });
    }

    return res.status(200).json({
      message: "Investment found",
      data,
      success: true,
    });

  } catch (error) {
    console.error("INVESTMENT ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};



export const helpAndSupport = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { message, subject } = req.body;
    console.log(req.body);
    if (!message || !subject) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    const support = await Support.create({
      userId,
      message,
      subject,
      createdAt: new Date(),
    });
    await support.save();
    res
      .status(201)
      .json({ success: true, message: "Support request sent Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getAllHelpAndSupportHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const supportHistory = await Support.find({ userId }).sort({
      createdAt: -1,
    });
    res.json({ success: true, data: supportHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.showPassword = newPassword
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const testInvestment = async (req, res) => {
  try {
    const { investmentAmount } = req.body;
    const userId = req.user._id;

    if (!userId || !investmentAmount) {
      return res.status(400).json({
        success: false,
        message: "Investment amount is required",
      });
    }

    if (Number(investmentAmount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const txResponse = "TEST_TX_" + uuidv4();

    const existingInvestment = await Investment.findOne({ txResponse });

    if (existingInvestment) {
      return res.status(409).json({
        success: false,
        message: "Transaction already processed",
      });
    }

    const amount = Number(investmentAmount);
    const newInvestment = await Investment.create({
      userId,
      investmentAmount: amount,
      txResponse,
      investmentDate: new Date(),
    });


    user.investments.push(newInvestment._id);
    user.myInvestment += amount;
    user.todayInvestment += amount;
    user.isVerified = true;
    user.status = true;

    if (!user.activeDate) {
      user.activeDate = new Date();
    }

    await user.save();


    await updateTeamInvestment(user._id, amount);
    await distributeReferralIncome(user._id, amount);


    return res.status(201).json({
      success: true,
      message: "Investment successful (TEST MODE)",
      investment: newInvestment,
      totalInvestment: user.myInvestment,
    });

  } catch (error) {
    console.error("Error in Test Investment:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getUserDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // ✅ USER DATA
    const user = await User.findById(userId)
      .populate("myReferrals", "_id name")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // ✅ SAFE FIXED VALUES
    const selfInvestment = Number(user.myInvestment || 0).toFixed(2);
    const totalPayout = Number(user.totalWithdrawals || 0).toFixed(2);
    const myReferrals = user.myReferrals?.length || 0;

    // ✅ TEAM COUNT
    const getTeamCount = async (userIds) => {
      let total = 0;

      const users = await User.find({ sponsorId: { $in: userIds } }).select("_id");

      if (users.length === 0) return 0;

      const ids = users.map((u) => u._id);
      total += ids.length;

      const nextLevel = await getTeamCount(ids);
      total += nextLevel;

      return total;
    };

    const myTeam = await getTeamCount([userId]);

    // ✅ TEAM IDS
    const teamUsers = await User.find({ sponsorId: userId }).select("_id");
    let teamIds = teamUsers.map((u) => u._id);

    const getAllTeamIds = async (ids) => {
      const users = await User.find({ sponsorId: { $in: ids } }).select("_id");
      if (users.length === 0) return ids;

      const newIds = users.map((u) => u._id);
      return [...ids, ...(await getAllTeamIds(newIds))];
    };

    teamIds = await getAllTeamIds(teamIds);

    // ✅ TEAM INVESTMENT
    const teamInvestmentData = await User.aggregate([
      {
        $match: { _id: { $in: teamIds } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$myInvestment" },
        },
      },
    ]);

    const teamInvestment = Number(teamInvestmentData[0]?.total || 0).toFixed(2);

    // ✅ OTHER FIELDS
    const earnings = Number(user.totalEarnings || 0).toFixed(2);
    const dailyROI = Number(user.dailyROI || 0).toFixed(2);

    const referralIncomeData = await ReferralIncome.findOne({ userId });

    const referralIncome = Number(referralIncomeData?.totalIncome || 0).toFixed(2);
    const todayReferral = Number(referralIncomeData?.todayIncome || 0).toFixed(2);

    return res.status(200).json({
      success: true,
      data: {
        selfInvestment,
        totalPayout,
        myReferrals,
        myTeam,
        teamInvestment,
        earnings,
        dailyROI,
        referralIncome,
        todayReferral,
      },
    });
  } catch (error) {
    console.error("Dashboard Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const generateRandomPassword = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};


export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // generate new password
    const newPassword = generateRandomPassword();

    // hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update DB
    user.password = hashedPassword;
    user.showPassword = newPassword; // ⚠️ (not recommended but you already use it)
    await user.save();

    // send mail
    await sendNewPassword(user.email, newPassword, user.username);

    return res.status(200).json({
      success: true,
      message: "New password sent to your email",
    });

  } catch (error) {
    console.log("FORGET PASSWORD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};