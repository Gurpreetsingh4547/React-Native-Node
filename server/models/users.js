import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        reqruied: true
    },
    email: {
        type: String,
        reqruied: true,
        unique: true
    },
    password: {
        type: String,
        reqruied: true,
        minLength: [8, "Password should be at least 8 characters"],
        select: false
    },
    avatar: {
        public_id: String,
        url: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    tasks: [{
        title: String,
        description: String,
        completed: Boolean,
        createdAt: Date
    }],
    otp: Number,
    otp_expiry: Date,
    verified: {
        type: Boolean,
        default: false
    }
});

userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

/**
 * Generate a JWT token for the user
 * @returns {string} The JWT token
 */
userSchema.methods.getJWTToken = function () {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    });
};

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.index({ otp_expiry: 1 }, { expireAfterSeconds: 0 });

export const User = mongoose.model("User", userSchema);