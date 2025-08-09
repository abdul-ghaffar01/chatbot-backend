import jwt_verify from '../../helper/jwt_verify.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';
import { broadcastOnlineUsers } from '../utils/broadcastOnlineUsers.js';
import { onlineUsers, userSockets } from '../utils/maps.js';
import disconnect from './disconnectEventHandler.js';
import sendMessageEventHanlder from './sendMessageEventHandler.js';

export default function setupSocketHandlers(io) {
    io.on('connection', async (socket) => {
        const token = socket.handshake.query.token;
        const decoded = jwt_verify(token); // Verify token
        const userId = decoded?.userId || null;
        const isAdmin = decoded?.role === "admin"; // Role should be in token

        console.log(`🟢 New client connected: ${socket.id}, userId: ${userId}, isAdmin: ${isAdmin}`);

        // Fetch all users and send to every connected socket
        const allUsers = await User.find().select('fullName _id');
        socket.emit('allUsers', allUsers);

        broadcastOnlineUsers(io);


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

                broadcastOnlineUsers(io)

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

        // Send message handler modularized
        sendMessageEventHanlder(io, socket, userId);

        // Event: Fetch last N messages used for download purpose
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


        disconnect(io, socket)
    });
}
