// socket/chatSocket.js
// import Chat from "../models/Chat.js";
import jwt from "jsonwebtoken";
import Chat from "../models/chat.model.js";

export default function chatSocket(io) {
    // Check if user is logged in (JWT)
    io.use((socket, next) => {
        const token = socket.handshake.auth.token; // Get token from frontend
        if (!token) return next(new Error("Please log in"));
        try {
            socket.user = jwt.verify(token, process.env.JWT_SECRET); // Verify user
            next();
        } catch (error) {
            next(new Error("Invalid login"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`🟢 User ${socket.user._id} connected`);

        // Join teamspace chat room
        socket.on("joinTeamspace", (teamspaceId) => {
            socket.join(teamspaceId);
            console.log(`User joined teamspace ${teamspaceId}`);
        });

        // Send new message
        socket.on("sendMessage", async ({ teamspaceId, content }) => {
            try {
                let chat = await Chat.findOne({ teamspaceId });
                if (!chat) {
                    chat = new Chat({ teamspaceId, messages: [] });
                }

                const newMessage = {
                    sender: socket.user._id, // Use logged-in user
                    content,
                    timestamp: new Date(),
                };

                chat.messages.push(newMessage);
                await chat.save();

                // Add sender's name
                const populatedMsg = await Chat.populate(newMessage, {
                    path: "sender",
                    select: "name",
                });

                // Send to everyone in teamspace
                io.to(teamspaceId).emit("receiveMessage", {
                    _id: newMessage._id,
                    sender: populatedMsg.sender,
                    content,
                    timestamp: newMessage.timestamp,
                });
            } catch (error) {
                console.error("Error sending message:", error);
                socket.emit("error", "Could not send message");
            }
        });

        socket.on("disconnect", () => {
            console.log(`🔴 User ${socket.user._id} disconnected`);
        });
    });
}
