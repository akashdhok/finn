import nodemailer from "nodemailer";
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};


export const sendOTP = async (email, otp, username) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: `"NexoCoin" <${process.env.EMAIL}>`,
            to: email,
            subject: "🔐 Email Verification OTP",
            headers: {
                "X-Priority": "1",
                "X-MSMail-Priority": "High",
                Importance: "high",
            },
            html: `
                <div style="max-width: 400px; margin: auto; padding: 20px; text-align: center; font-family: Arial, sans-serif;
                            border: 1px solid #ddd; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); background: #fff;">
                
                    <h2 style="color: #007bff; margin-bottom: 10px;">🔐 Withdrawal OTP Verification</h2>
                    
                    <p style="font-size: 16px; font-weight: bold;">Dear ${username || "User"},</p>
                    
                    <p style="color: #333; font-size: 14px;">
                        You have requested to withdraw funds from your 1 Trade account.
                        Please use the OTP below to verify and complete your withdrawal process:
                    </p>
                    
                    <div style="background: #f3f3f3; padding: 12px 24px; font-size: 22px; font-weight: bold;
                                display: inline-block; border-radius: 8px; letter-spacing: 2px; margin: 10px 0;
                                user-select: all;">
                        ${otp}
                    </div>
                    
                    <p style="font-size: 12px; color: #888; margin-top: 5px;">Tap & Hold to Copy</p>
                    
                    <p style="font-size: 12px; color: gray; margin-top: 10px;">This OTP is valid for 10 minutes only.</p>
                    
                
                    
                    <p style="font-weight: bold; color: #007bff; margin-top: 15px;">- The NexoCoin  Team</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log("Error sending withdrawal OTP:", error);
    }
};


export const sendNewPassword = async (email, password, username) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: `"NexoCoin" <${process.env.EMAIL}>`,
      to: email,
      subject: "🔑 Your New Password",
      html: `
        <div style="max-width:400px;margin:auto;padding:20px;text-align:center;font-family:sans-serif;">
          <h2 style="color:#007bff;">Reset Password</h2>
          <p>Hello ${username || "User"},</p>
          <p>Your new generated password is:</p>

          <div style="font-size:22px;font-weight:bold;background:#f3f3f3;padding:10px;border-radius:6px;">
            ${password}
          </div>

          <p style="margin-top:10px;">Use this password to login.</p>
          <p style="color:red;">Please change it after login.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.log("Error sending password:", err);
  }
};