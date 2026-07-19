
import jwt from "jsonwebtoken";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] ||
      req.headers.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.userId = decoded.id;   
    req.user = { _id: decoded.id }; 

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};