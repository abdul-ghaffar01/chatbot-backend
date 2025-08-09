import Message from "../../../models/Message.js";
import { userSockets } from "../../utils/maps.js";

export default async function sendMessageAdmin(io, socket) {

    // ✅ Admin sends a message to a specific user
    socket.on("adminSendMessage", async ({ targetUserId, content }) => {
        try {

            // Save message in DB (sender: admin)
            const adminMessage = await Message.create({
                userId: process.env.ADMIN_ACCOUNT_ID,
                content,
                sender: "Abdul Ghaffar",
                to: targetUserId,
            });

            // Emit to the specific user if they are online
            const recipientSocketId = userSockets.get(targetUserId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit("receiveMessage", adminMessage);
            }

            // Also emit to admin for UI sync
            socket.emit("adminReceiveMessage", adminMessage);
        } catch (err) {
            console.error("Error in adminSendMessage:", err.message);
        }
    });

}