import jwt_verify from '../../helper/jwt_verify.js';
import Message from '../../models/Message.js';
import User from '../../models/User.js';
import getChats from '../../utils/getChats.js';
import { broadcastOnlineUsers } from '../utils/broadcastOnlineUsers.js';
import { onlineUsers, userSockets } from '../utils/maps.js';
import chatHistoryForAdmin from './admin/chatHistoryHandler.js';
import getAllChatsForAdmin from './admin/getAllChatsHandler.js';
import sendMessageAdmin from './admin/sendMessageHnadler.js';
import toggleBotReplies from './admin/toggleBotReplies.js';
import disconnect from './disconnectEventHandler.js';
import getLastNMessages from './getLastNMessages.js';
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

                // there is possibility that user has just created account so sending chats to user
                const adminSocketId = userSockets.get("admin");
                if (adminSocketId) {
                    getChats().then((allChats) => {
                        io.to(adminSocketId).emit("allChats", allChats);
                    }).catch((err) => {
                        console.error('Error in getChats():', err.message);
                        io.to(adminSocketId).emit('allChats', []);
                    });
                }

                socket.emit('chatHistory', history);
            }
        } catch (err) {
            console.error('Connection error:', err.message);
        }

        // Send message handler for client
        sendMessageEventHanlder(io, socket, userId);

        // Get last n messages of client: used on download page in options
        getLastNMessages(socket, userId)
        // ------------------ Admin events ------------------
        // Get all chats for admin to list on admin panel
        getAllChatsForAdmin(socket)

        // Chat history of each chat for admin
        chatHistoryForAdmin(socket)

        // To turn on or off bot replies for user
        toggleBotReplies(io, socket)

        // Send message for admin to send message to users
        sendMessageAdmin(io, socket)

        // When a user disconnects
        disconnect(io, socket)
    });
}
