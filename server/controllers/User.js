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

    // Genrate OTP
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

    // Send Otp Mail
    await sendMail(email, "Verify your account", `Your OTP is ${otp}`);

    // Send Token After Registeration
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

/**
 * Verify user with OTP
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const verify = async (req, res) => {
  try {
    // Convert OTP to number
    const otp = Number(req.body.otp);

    // Find user by ID
    const user = await User.findById(req.user._id);

    // Check if OTP is valid and not expired
    if (user.otp !== otp || user.otp_expiry < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid OTP or has been Expired" });
    }

    // Set user as verified and reset OTP data
    user.verified = true;
    user.otp = null;
    user.otp_expiry = null;

    // Save user changes
    await user.save();

    // Send success response
    SendToken(res, user, 200, "Account verified successfully");
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Log in a user
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const loginUser = async (req, res) => {
  try {
    // Destructure email and password from request body
    const { email, password } = req.body;

    // If email or password is missing, return a 400 error response
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    // Check if user with the provided email exists
    let user = await User.findOne({ email }).select("+password");

    // If user does not exist, return a 400 error response
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    // Compare the provided password with the user's password
    const isMatch = await user.comparePassword(password);

    // If passwords do not match, return a 400 error response
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Email or Password" });
    }

    // Send token and return a 200 success response
    SendToken(res, user, 200, "Login successfully");
  } catch (error) {
    // Return a 500 error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Logout the user by clearing the token cookie and returning a success message
 * @param {Request} req - The request object
 * @param {Response} res - The response object
 */
export const logout = async (req, res) => {
  try {
    // Clear the token cookie, set status to 200, and return a success message
    res
      .status(200)
      .cookie("token", null, { expires: new Date(Date.now()) })
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Add a new task to the user's task list
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
export const addTask = async (req, res) => {
  try {
    // Extract title and description from the request body
    const { title, description } = req.body;

    // Find the user by their ID
    const user = await User.findById(req.user._id);

    // Add the new task to the user's task list
    user.tasks.push({
      title,
      description,
      completed: false,
      createdAt: new Date(Date.now()),
    });

    // Save the user with the new task added
    await user.save();

    // Return a success response
    res.status(200).json({ success: true, message: "Task added successfully" });
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Remove a task from user's tasks list
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
export const removeTask = async (req, res) => {
  try {
    // Get the taskId from request parameters
    const { taskId } = req.params;

    // Find the user by id
    const user = await User.findById(req.user._id);

    // Filter out the task with taskId from user's tasks
    user.tasks = user.tasks.filter(
      (task) => task._id.toString() != taskId.toString()
    );

    // Save the user with updated tasks list
    await user.save();

    // Return success response
    res
      .status(200)
      .json({ success: true, message: "Task removed successfully" });
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update the completion status of a task
 * @param {object} req - The request object
 * @param {object} res - The response object
 */
export const updateTask = async (req, res) => {
  try {
    // Extract taskId from request parameters
    const { taskId } = req.params;

    // Find the user by ID
    const user = await User.findById(req.user._id);

    // Find the task by ID and update its completion status
    user.task = user.tasks.find(
      (task) => task._id.toString() === taskId.toString()
    );
    user.task.completed = !user.task.completed;

    // Save the updated user
    await user.save();

    // Send a success response with the updated task
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

/**
 * Get the user's profile
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 */
export const getMyProfile = async (req, res) => {
  try {
    // Find the user by their ID
    const user = await User.findById(req.user._id);
    
    // Send the user's profile as a response
    SendToken(res, user, 200, "Profile fetched successfully");
  } catch (error) {
    // Return error response if an exception occurs
    res.status(500).json({ success: false, message: error.message });
  }
};
