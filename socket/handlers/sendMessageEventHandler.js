import Message from "../../models/Message";
import { onlineUsers, userSockets } from "../utils/maps";

export default async function sendMessageEventHanlder(io, socket) {
    // ✅ Send Message (User -> Bot -> Admin Notification)
    socket.on('sendMessage', async (data) => {
        try {
            // Save user's message
            const savedUserMessage = await Message.create({
                userId: userId,
                content: data.content,
                sender: "user",
                to: process.env.BOT_ACCOUNT_ID || "68860f0b7d694be675bae2ff"
            });

            socket.emit("typing")
            // Send message back to sender (user)
            socket.emit('receiveMessage', savedUserMessage);

            // Notify admin in real-time
            const adminSocketId = userSockets.get("admin");
            if (adminSocketId) {
                io.to(adminSocketId).emit("adminReceiveMessage", savedUserMessage);
            }

            // Send bot reply (if enabled)
            const recipientSocketId = userSockets.get(userId);
            const userInfo = onlineUsers.get(recipientSocketId);

            if (recipientSocketId && userInfo?.botRepliesEnabled) {
                // Fetch bot reply
                const res = await fetch(`${process.env.CHATBOT_BACKEND_URL}/chatbot-resp`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.CHATBOT_API_TOKEN}`
                    },
                    body: JSON.stringify({ message: data.content }),
                });

                const botData = await res.json();
                const botReply = botData.reply || botData || "I'm here to help!";

                // Save bot message
                const savedBotMessage = await Message.create({
                    userId: process.env.BOT_ACCOUNT_ID || "68860f0b7d694be675bae2ff",
                    content: botReply,
                    sender: "chatbot",
                    to: userId
                });
                socket.emit("stopTyping")
                // Send bot reply to user
                io.to(recipientSocketId).emit('receiveMessage', savedBotMessage);

                // Send bot reply to admin
                if (adminSocketId) {
                    io.to(adminSocketId).emit("adminReceiveMessage", savedBotMessage);
                }
            }
        } catch (err) {
            socket.emit("stopTyping")
            console.error('Message error:', err.message);
        }
    });

}