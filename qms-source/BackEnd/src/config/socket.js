import { Server } from "socket.io";

let io;




export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:3000", "http://ec2-13-233-161-146.ap-south-1.compute.amazonaws.com:3000", "https://syscomply.com"], // Change this to match frontend URL
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("✅ WebSocket Connection Established:", socket.id);

        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`📢 User ${userId} joined room`);
        });

        socket.on("disconnect", () => {
            console.log("❌ User disconnected:", socket.id);
        });
    });

    return io;
};



export const getSocket = () => {
    if (!io) {
        throw new Error("Socket.io not initialized");
    }
    return io;
};
