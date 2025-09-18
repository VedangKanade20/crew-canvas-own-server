import { Router } from "express";
import {
    registerUser,
    loginUser,
    logout,
    getCurrentUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/user.middleware.js";

const router = Router();

// ✅ Normal Authentication Routes
router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/logout", logout);

// router.post("/verify-email", verifyEmail);
// router.post("/forgot-password", forgotPassword);
// router.post("/reset-password/:token", resetPassword);
router.get("/protected", verifyJWT, (req, res) => {
    res.json({ user: req.user });
});

router.get("/me", verifyJWT, getCurrentUser);
export default router;
