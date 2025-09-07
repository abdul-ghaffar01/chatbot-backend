import Message from "../../models/Message.js";
import getChats from "../../utils/getChats.js";
import { onlineUsers, userSockets } from "../utils/maps.js";
import jwt from "jsonwebtoken";
export default async function sendMessageEventHanlder(io, socket, userId) {
    socket.on("sendMessage", async (data) => {
        try {
            // Save user's message to DB
            const savedUserMessage = await Message.create({
                userId: userId,
                content: data.content,
                sender: "user",
                to: process.env.BOT_ACCOUNT_ID || "68860f0b7d694be675bae2ff",
            });

            // 🔑 Keep the tempId so client can update
            const userMessageWithTempId = {
                ...savedUserMessage.toObject(),
                tempId: data.tempId,   // 👈 preserve tempId
            };

            // Send back to sender (will update pending → delivered)
            socket.emit("receiveMessage", userMessageWithTempId);
            // setTimeout(() => {
            //     socket.emit('receiveMessage', {
            //         ...savedUserMessage.toObject(),
            //         tempId: data.tempId, // keep tempId for matching!
            //     });
            // }, 2000); // 2s delay

            // Notify admin in real-time
            const adminSocketId = userSockets.get("admin");
            if (adminSocketId) {
                io.to(adminSocketId).emit("adminReceiveMessage", userMessageWithTempId);
            }

            // Send bot reply (if enabled)
            const recipientSocketId = userSockets.get(userId);
            const userInfo = onlineUsers.get(recipientSocketId);

            if (recipientSocketId && userInfo?.botRepliesEnabled) {
                socket.emit("typing");

                const apiToken = jwt.sign(
                    { role: "chatbot", iat: Math.floor(Date.now() / 1000) },
                    process.env.JWT_SECRET_FOR_BOT_TO_HIT_RESPONSE_URL,
                    { expiresIn: "1m" } // short-lived
                );

                const res = await fetch(`${process.env.CHATBOT_BACKEND_URL}/chatbot-resp`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiToken}`,
                    },
                    body: JSON.stringify({ message: data.content }),
                });

                const botData = await res.json();
                const botReply = botData.reply || "Couldn't get response from GPT";

                // Save bot reply
                const savedBotMessage = await Message.create({
                    userId: process.env.BOT_ACCOUNT_ID || "68860f0b7d694be675bae2ff",
                    content: botReply,
                    sender: "chatbot",
                    to: userId,
                });

                socket.emit("stopTyping");

                // emitting chats again on every message
                getChats().then((allChats) => {
                    if (adminSocketId) {
                        io.to(adminSocketId).emit("allChats", allChats);
                    }
                })

                // Send bot reply to user
                io.to(recipientSocketId).emit("receiveMessage", savedBotMessage);

                // Send bot reply to admin
                if (adminSocketId) {
                    io.to(adminSocketId).emit("adminReceiveMessage", savedBotMessage);
                }
            }
        } catch (err) {
            socket.emit("stopTyping");
            console.error("Message error:", err.message);
        }
    });
}
