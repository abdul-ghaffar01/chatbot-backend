// Stores online users' info keyed by their Socket.IO connection ID.
// Key   -> socketId (string) — unique identifier for a live socket connection.
// Value -> object containing user-specific data (e.g., userId, botRepliesEnabled, etc.).
// Purpose: Allows quick lookups of user details when you already have their socketId.
export const onlineUsers = new Map();


// Maps each user to their active Socket.IO connection ID.
// Key   -> userId (string) — unique identifier for the user in the database.
// Value -> socketId (string) — the live socket connection for that user.
// Purpose: Allows you to emit events directly to a user when you know their userId.
export const userSockets = new Map();
