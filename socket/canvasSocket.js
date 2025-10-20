// socket/canvasSocket.js
import Canvas from "../models/canvas.model.js"; // adjust path

export default function canvasSocket(io) {
    io.on("connection", (socket) => {
        socket.on("canvas_join", async ({ teamspaceId, userId }) => {
            socket.join(teamspaceId);
        });

        socket.on("canvas_update", async ({ teamspaceId, scene, sender }) => {
            try {
                // Save or merge to DB
                let canvas = await Canvas.findOne({ teamspaceId });
                if (!canvas) {
                    canvas = new Canvas({ teamspaceId, canvasData: scene });
                } else {
                    // Option: override entire canvas
                    canvas.canvasData = scene;
                    canvas.updatedAt = Date.now();
                }
                await canvas.save();

                // broadcast to everyone in room except sender
                socket.to(teamspaceId).emit("canvas_update", { scene, sender });
            } catch (err) {
                console.error("canvas_update error", err);
            }
        });

        socket.on("canvas_leave", ({ teamspaceId }) => {
            socket.leave(teamspaceId);
        });
    });
}
