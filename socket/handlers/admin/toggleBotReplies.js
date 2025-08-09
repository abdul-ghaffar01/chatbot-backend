import Message from "../../../models/Message.js";
import { onlineUsers } from "../../utils/maps.js";

export default async function toggleBotReplies(io, socket) {

    // Admin toggles bot replies for a user
    socket.on('toggleBotReply', async ({ targetUserId, enabled }) => {
        for (let [sockId, info] of onlineUsers) {
            if (info.userId.toString() === targetUserId.toString()) {
                info.botRepliesEnabled = enabled; // ✅ Toggle in memory
                onlineUsers.set(sockId, info);

                const targetSocket = io.sockets.sockets.get(sockId);

                // ✅ Create an info message for the user
                const infoMessage = await Message.create({
                    userId: targetUserId,
                    content: enabled
                        ? "🤖 Bot replies have been re-enabled by Abdul Ghaffar."
                        : "⛔ Bot replies have been paused by Abdul Ghaffar.",
                    sender: "info",
                    to: targetUserId,
                });

                // Send info message to user
                if (targetSocket) {
                    targetSocket.emit('receiveMessage', infoMessage);
                    targetSocket.emit('botReplyStatus', { enabled });
                }


                // Emit to admin UI (if reconnects quickly or logs are needed)
                const adminSocketId = userSockets.get("admin");
                if (adminSocketId && infoMessage) {
                    io.to(adminSocketId).emit("adminReceiveMessage", infoMessage);
                }
                break;
            }
        }
    });
}