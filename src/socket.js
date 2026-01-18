import { io } from "socket.io-client";

export const socket = io("https://emsbackend-2w9c.onrender.com", {
  transports: ["websocket"],
  autoConnect: false,        // ✅ don't connect until user is logged in
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
