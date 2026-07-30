import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateVerificationCode } from "../utils/generateToken.js";
// import crypto from "crypto";
// import {
//     sendVerificationEmail,
//     sendWelcomeEmail,
//     sendPasswordResetEmail,
//     sendResetSuccessfulEmail,
// } from "../mail/emails.js";

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).send("Please fill all the fields");
    }
    // -----------------------------------------------------
    // await User.collection.dropIndex("name_1");
    // ----------------------------------------------------

    let existingUser = await User.findOne({ email });
    if (existingUser) return res.status(401).send("User already exists");

    const hashPassword = await bcrypt.hash(password, 10);
    // const verificationToken = generateVerificationCode();

    const user = new User({
        name,
        email,
        password: hashPassword,
        // verificationToken,
        // verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });

    // directly authenticating user
    const token = user.generateAuthToken();

    if (!token)
        return res.status(500).json({ message: "Internal server error" });

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    };

    res.cookie("token", token, cookieOptions);

    // await sendVerificationEmail(user.email, verificationToken);
    await user.save();
    res.status(200).json({
        message: "User registered successfully",
        user: {
            ...user._doc,
            password: undefined,
        },
        token,
    });
}; // checked

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await user.isPasswordCorrect(password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = user.generateAuthToken();

        user.lastLogin = new Date();
        await user.save();
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        };
        res.cookie("token", token, cookieOptions);
        res.status(200).json({
            user: {
                ...user._doc,
                password: undefined,
            },
            token,
            message: "User logged in successfully",
        });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}; // checked

export const logout = (_, res) => {
    res.clearCookie("token");
    res.status(200).json({ message: "User logged out successfully" });
}; // checked

export const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by verifyJWT
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not founddddddddd" });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error("GetCurrentUser Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
