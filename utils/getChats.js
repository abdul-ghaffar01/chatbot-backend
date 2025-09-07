import Message from "../models/Message.js";
import User from "../models/User.js";

export default async function getChats() {
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
    return formattedChats;
}