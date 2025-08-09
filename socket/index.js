import { Server } from 'socket.io';
import setupSocketHandlers from "./handlers/handler.js"
export default function setupSocket(server) {
    const io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    setupSocketHandlers(io);
}
