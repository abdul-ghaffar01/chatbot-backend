import { onlineUsers } from './maps.js';

export const broadcastOnlineUsers = (io) => {
  const uniqueUsers = Array.from(
    new Map([...onlineUsers.values()].map(u => [u.userId || u.socketId, u])).values()
  );
  io.emit('onlineUsers', uniqueUsers);
};
