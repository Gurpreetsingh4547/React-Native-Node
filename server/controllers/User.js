// Models
import { User } from "../models/users.js";

// Services
import { sendMail } from "../utils/SendMail.js";
import { SendToken } from "../utils/SendToken.js";

/**
 * Register a new user
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const registerUser = async (req, res) => {
  try {
    // Destructure name, email, and password from request body
    const { name, email, password } = req.body;

    // Check if user with the same email already exists
    let user = await User.findOne({ email });

    // If user already exists, return an error response
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const otp = Math.floor(Math.random() * 1000000);

    // Create a new user
    user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: "sample_id",
        url: "",
      },
      otp,
      otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000),
    });

    await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

    SendToken(
      res,
      user,
      201,
      "OTP sent to your email, please verify your account"
    );
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verify = async (req, res) => {
  try {
    const otp = Number(req.body.otp);

    const user = await User.findById(req.user._id);

    if (user.otp != otp || user.otp_expiry < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or has been Expired" });
    }

    user.verified = true;
    user.otp = null;
    user.otp_expiry = null;

    await user.save();

    SendToken(res, user, 200, "Account verified successfully");
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    // Destructure name, email, and password from request body
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // Check if user with the same email already exists
    let user = await User.findOne({ email }).select("+password");

    // If user already exists, return an error response
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    const isMatch = await user.comparePassword(password);

    console.log(isMatch);

    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    SendToken(res, user, 200, "Login successfully");
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()) })
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addTask = async (req, res) => {
  try {
    const { title, desciption } = req.body;

    const user = await User.findById(req.user._id);

    user.tasks.push({
      title,
      desciption,
      completed: false,
      createdAt: new Date(Date.now()),
    });

    await user.save();

    res.status(200).json({ success: true, message: "Task added successfully" });
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const user = await User.findById(req.user._id);

    user.tasks = user.tasks.filter(
      (task) => task._id.toString() != taskId.toString()
    );

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Task removed successfully" });
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const user = await User.findById(req.user._id);

    user.task = user.tasks.find(
      (task) => task._id.toString() === taskId.toString()
    );

    user.task.completed = !user.task.completed;

    await user.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Task updated successfully",
        data: user.task,
      });
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    SendToken(res, user, 200, "Profile fetched successfully");
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};
