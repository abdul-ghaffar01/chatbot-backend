import getChats from "../../../utils/getChats.js";

export default async function getAllChatsForAdmin(socket) {

    // ✅ Admin: Fetch All Chats (latest per user)
    socket.on('getAllChats', async () => {
        try {
            getChats().then((formattedChats) => {
                socket.emit('allChats', formattedChats);
            }).catch((err) => {
                console.error('Error in getChats():', err.message);
                socket.emit('allChats', []);
            });

            socket.emit('allChats', formattedChats);
        } catch (err) {
            console.error('Error fetching chats:', err.message);
            socket.emit('allChats', []);
        }
    });
}