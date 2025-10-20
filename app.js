import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import router from "./routes/user.route.js";
import teamspaceRouter from "./routes/teamspace.route.js";
import canvasRouter from "./routes/canvas.route.js";
import chatRouter from "./routes/chat.route.js";
import noteRouter from "./routes/note.route.js";
import taskRouter from "./routes/task.route.js";
import { Server } from "socket.io";
import http from "http";
import agoraRoutes from "./routes/agoraRoutes.js";
import chatSocket from "./socket/chatSocket.js";
import canvasSocket from "./socket/canvasSocket.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
});

// Configure CORS to allow requests from your frontend's origin
app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/", (_, res) => {
    res.send("hello , world");
});

app.use("/api/auth", router);
app.use("/api/teamspace", teamspaceRouter);
app.use("/api/teamspace", canvasRouter);
app.use("/api/teamspace", chatRouter);
app.use("/api/teamspace", noteRouter);
app.use("/api/teamspace", taskRouter);
app.use("/api/agora", agoraRoutes);

chatSocket(io);
canvasSocket(io);

export default app;
