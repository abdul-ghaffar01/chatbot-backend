import Message from "../../../models/Message.js";

export default async function chatHistoryForAdmin(socket) {

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

}