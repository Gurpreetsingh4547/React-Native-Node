import jwt from "jsonwebtoken";
import { User } from "../models/users.js";

/**
 * Middleware to check if the user is authenticated
 * @param {object} req - The request object
 * @param {object} res - The response object
 * @param {function} next - The next function to be called
 */
export const isAuthenticated = async (req, res, next) => {
  try {
    const { token } = req.cookies;

    if(!token) {
      return res.status(401).json({ success: false, message: "Please login to access this resource" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id);
    next();


  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};
