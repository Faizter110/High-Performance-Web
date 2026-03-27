import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    // Connect to same origin
    socket = io({
      path: "/socket.io",
      transports: ["websocket"],
      autoConnect: true,
    });
    
    socket.on("connect", () => {
      console.log("Connected to game server");
    });
    
    socket.on("disconnect", () => {
      console.log("Disconnected from game server");
    });
  }
  return socket;
};
