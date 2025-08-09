import Message from "../../models/Message.js";

export default async function getLastNMessages(socket) {

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
}