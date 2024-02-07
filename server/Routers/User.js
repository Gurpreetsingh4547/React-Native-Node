import express from "express";

// Controllers
import { registerUser, verify, loginUser, logout, addTask, removeTask, updateTask, getMyProfile } from "../controllers/User.js";
import { isAuthenticated } from "../middleware/auth.js";

const router = express.Router();

// Define Routes
router.route('/register').post(registerUser);
router.route('/verify').post(isAuthenticated, verify);
router.route('/login').post(loginUser);
router.route('/logout').get(logout);
router.route('/profile').get(isAuthenticated, getMyProfile);
router.route('/addTask').post(isAuthenticated, addTask);
router.route('/task/:taskId').delete(isAuthenticated, removeTask).put(isAuthenticated, updateTask);

export default router;