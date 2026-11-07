import { Server } from "socket.io";

const connections = new Map();
const messages = new Map();
const maxRoomLength = 128;
const maxMessageLength = 1000;
const maxStoredMessages = 100;

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-call", (room) => {
      if (
        typeof room !== "string" ||
        !room.trim() ||
        room.length > maxRoomLength
      ) return;
      room = room.trim();

      const previousRoom = socket.data.room;
      if (previousRoom === room) return;

      if (previousRoom && previousRoom !== room) {
        removeFromRoom(previousRoom, socket);
        socket.leave(previousRoom);
      }

      if (!connections.has(room)) {
        connections.set(room, new Set());
      }

      const clients = connections.get(room);
      clients.add(socket.id);

      socket.data.room = room;
      socket.join(room);

      io.to(room).emit("user-joined", socket.id, [...clients]);

      for (const message of messages.get(room) ?? []) {
        socket.emit("chat-message", message.data, message.sender, message.socketId);
      }
    });

    socket.on("signal", (toId, message) => {
      const target = typeof toId === "string" ? io.sockets.sockets.get(toId) : null;
      const room = socket.data.room;
      if (
        typeof message !== "string" ||
        message.length > maxMessageLength * 100 ||
        !room ||
        target?.data.room !== room
      ) return;
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const room = socket.data.room;
      if (
        !room ||
        typeof data !== "string" ||
        !data.trim() ||
        data.length > maxMessageLength ||
        !connections.get(room)?.has(socket.id)
      ) return;

      const safeSender = typeof sender === "string" ? sender.trim().slice(0, 40) : "";
      const chatMessage = {
        sender: safeSender,
        data: data.trim(),
        socketId: socket.id,
      };
      const history = messages.get(room) ?? [];
      history.push(chatMessage);
      if (history.length > maxStoredMessages) history.shift();
      messages.set(room, history);
      io.to(room).emit("chat-message", chatMessage.data, chatMessage.sender, socket.id);
    });

    socket.on("disconnect", () => {
      const room = socket.data.room;
      if (room) {
        removeFromRoom(room, socket);
      }
    });
  });

  function removeFromRoom(room, socket) {
    const clients = connections.get(room);
    if (!clients?.has(socket.id)) return;

    socket.to(room).emit("user-left", socket.id);
    clients.delete(socket.id);

    if (clients.size === 0) {
      connections.delete(room);
      messages.delete(room);
    }
  }

  return io;
};
