import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_BACK;

export const socket = io(SOCKET_URL, {
    transports: ["websocket"],
    withCredentials: true,
    autoConnect: false,
});

let isConnected = false;
let hasJoined = false;

export const connectSocket = (userId) => {
    if (!userId) {
        console.error("❌ User ID is required to establish WebSocket connection.");
        return;
    }

    if (!isConnected) {
        socket.connect();

        socket.on("connect", () => {
            console.log("✅ WebSocket Connected:", socket.id);

            if (!hasJoined) {
                socket.emit("join", userId);
                hasJoined = true;
                console.log("📢 Joined Room with User ID:", userId);
            }

            isConnected = true;
        });

        socket.on("disconnect", () => {
            console.log("❌ WebSocket Disconnected");
            isConnected = false;
            hasJoined = false;
        });

        socket.on("connect_error", (err) => {
            console.error("⚠️ WebSocket Connection Error:", err.message);
        });
    } else {
        console.log("⚠️ WebSocket already connected. Skipping reconnect.");
    }

    return socket;
};

export const disconnectSocket = () => {
    if (socket.connected) {
        socket.removeAllListeners();
        socket.disconnect();
        isConnected = false;
        hasJoined = false;
        console.log("❎ WebSocket Disconnected & Listeners Removed");
    }
};
