// backend/routes/agoraRoutes.js
import express from "express";
import dotenv from "dotenv";
import pkg from "agora-access-token";
const { RtcRole, RtcTokenBuilder } = pkg;

dotenv.config();

const router = express.Router();

router.get("/generateToken", (req, res) => {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;
    const channelName = req.query.channelName;
    const uid = req.query.uid || Math.floor(Math.random() * 100000);
    const role = RtcRole.PUBLISHER;

    if (!appId || !appCertificate) {
        return res.status(500).json({ error: "Agora credentials missing" });
    }
    if (!channelName) {
        return res.status(400).json({ error: "Channel name is required" });
    }

    const expireTime = 3600; // 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpire = currentTimestamp + expireTime;

    const token = RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpire
    );

    return res.json({ token, uid, appId });
});

export default router;
