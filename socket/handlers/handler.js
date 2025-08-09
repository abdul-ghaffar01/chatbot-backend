import jwt_verify from '../../helper/jwt_verify.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';

export default function setupSocketHandlers(io) {
    const onlineUsers = new Map();
    const userSockets = new Map();

    const broadcastOnlineUsers = () => {
        const uniqueUsers = Array.from(
            new Map([...onlineUsers.values()].map(user => [user.userId || user.socketId, user])).values()
        );
        io.emit('onlineUsers', uniqueUsers);
    };

    io.on('connection', async (socket) => {
        const token = socket.handshake.query.token;
        const decoded = jwt_verify(token); // Verify token
        const userId = decoded?.userId || null;
        const isAdmin = decoded?.role === "admin"; // Role should be in token

        console.log(`🟢 New client connected: ${socket.id}, userId: ${userId}, isAdmin: ${isAdmin}`);

        // Fetch all users and send to every connected socket
        const allUsers = await User.find().select('fullName _id');
        socket.emit('allUsers', allUsers);

        broadcastOnlineUsers();


        try {
            if (isAdmin) {
                // ✅ Register Admin
                userSockets.set("admin", socket.id);
                socket.emit("adminConnected", { message: "Admin connected successfully" });
            }

            if (userId) {
                const user = await User.findById(userId).select('fullName');
                const fullName = user?.fullName || 'Guest User';

                onlineUsers.set(socket.id, { userId, fullName, botRepliesEnabled: true });
                userSockets.set(userId, socket.id);

                broadcastOnlineUsers()

                // ✅ Send user's own chat history (Bot + User)
                const history = await Message.find({
                    $and: [
                        { isDeleted: false }, // Only non-deleted messages
                        {
                            $or: [
                                { userId: userId }, // Sent by user
                                { to: userId }      // Received by user
                            ]
                        }
                    ]
                }).sort({ sentAt: 1 }).limit(1000); // Oldest first

                socket.emit('chatHistory', history);
            }
        } catch (err) {
            console.error('Connection error:', err.message);
        }

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


        // Event: Fetch last N messages
        socket.on("get_last_messages", async ({ limit }) => {
            try {
                // ✅ Fetch last N messages (only user's messages, not deleted)
                const messages = await Message.find({
                    $and: [
                        { isDeleted: false },
                        { $or: [{ userId }, { to: userId }] }
                    ]
                })
                    .sort({ sentAt: -1 }) // Newest first
                    .limit(limit || 10); // Default to 10 if no limit provided
                // ✅ Send messages back to client
                socket.emit("last_messages", messages.reverse()); // Reverse to oldest-first order
            } catch (error) {
                socket.emit("error", { message: "Failed to fetch messages", error: error.message });
            }
        });

        // ✅ Admin: Fetch All Chats (latest per user)
        socket.on('getAllChats', async () => {
            try {
                const chats = await Message.aggregate([
                    {
                        $group: {
                            _id: "$userId",
                            lastMessage: { $last: "$content" },
                            lastSentAt: { $last: "$sentAt" }
                        }
                    },
                    { $sort: { lastSentAt: -1 } }
                ]);

                const userIds = chats.map((c) => c._id);
                const users = await User.find({ _id: { $in: userIds } }).select("fullName email");

                const formattedChats = chats.map((c) => {
                    const user = users.find((u) => u._id.toString() === c._id.toString());
                    return {
                        userId: c._id,
                        fullName: user?.fullName || "Unknown User",
                        email: user?.email,
                        lastMessage: c.lastMessage,
                        lastSentAt: c.lastSentAt,
                    };
                });

                socket.emit('allChats', formattedChats);
            } catch (err) {
                console.error('Error fetching chats:', err.message);
                socket.emit('allChats', []);
            }
        });

        // ✅ Admin: Fetch Chat History of Specific User
        socket.on("chatHistoryForAdmin", async (targetUserId) => {
            try {

                const history = await Message.find({
                    $or: [
                        { userId: targetUserId },
                        { to: targetUserId }
                    ]
                }).sort({ sentAt: 1 }).limit(1000);

                socket.emit("chatHistoryForAdmin", history);
            } catch (err) {
                console.error("Error fetching chat history for admin:", err.message);
                socket.emit("chatHistoryForAdmin", []);
            }
        });
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
            broadcastOnlineUsers()
        });

    });
}
