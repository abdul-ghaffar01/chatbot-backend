import Message from "../../models/Message.js";
import { broadcastOnlineUsers } from "../utils/broadcastOnlineUsers.js";
import { onlineUsers, userSockets } from "../utils/maps.js";

export default async function disconnect(io, socket) {

    // ✅ Disconnect
    socket.on('disconnect', async () => {
        console.log('🔴 Disconnected:', socket.id);
        const userInfo = onlineUsers.get(socket.id);

        if (userInfo?.userId) {
            userSockets.delete(userInfo.userId);
        }
        onlineUsers.delete(socket.id);

        // ✅ Check if admin disconnected
        if (userSockets.get("admin") === socket.id) {
            userSockets.delete("admin");

            // Wait for 5 minutes before re-enabling bot replies
            setTimeout(async () => {

                for (let [sockId, info] of onlineUsers) {
                    onlineUsers.set(sockId, info);

                    if (!info.botRepliesEnabled) {

                        info.botRepliesEnabled = true;

                        const userSocket = io.sockets.sockets.get(sockId);

                        // ✅ Create an info message for auto-reenable
                        const infoMessage = await Message.create({
                            userId: info.userId,
                            content: "⚠️ Admin disconnected for 5 minutes. Bot replies have been automatically re-enabled.",
                            sender: "info",
                            to: info.userId,
                        });

                        // Send to user
                        if (userSocket) {
                            userSocket.emit('receiveMessage', infoMessage);
                            userSocket.emit('botReplyStatus', { enabled: true });
                        }

                    }
                    // If admin reconnects during this window, we skip
                    const adminSocketId = userSockets.get("admin");
                    if (adminSocketId) {
                        io.to(adminSocketId).emit("adminReceiveMessage", infoMessage);
                    }
                }
            }, 5 * 60 * 1000); // 5 minutes
        }
        broadcastOnlineUsers(io)
    });
}