import { Server } from "socket.io";

const connections = {};
const messages = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    socket.on("join-call", (room) => {
      if (typeof room !== "string" || room.length === 0) return;

      const previousRoom = socket.data.room;
      if (previousRoom === room) return;

      if (previousRoom && previousRoom !== room) {
        removeFromRoom(previousRoom, socket);
        socket.leave(previousRoom);
      }

      if (!connections[room]) {
        connections[room] = [];
      }

      if (!connections[room].includes(socket.id)) {
        connections[room].push(socket.id);
      }

      socket.data.room = room;
      socket.join(room);

      const clients = connections[room];
      io.to(room).emit("user-joined", socket.id, clients);

      for (const message of messages[room] ?? []) {
        socket.emit("chat-message", message.data, message.sender, message.socketId);
      }
    });

    socket.on("signal", (toId, message) => {
      if (typeof toId !== "string" || typeof message !== "string") return;
      io.to(toId).emit("signal", socket.id, message);
    });

    socket.on("chat-message", (data, sender) => {
      const room = socket.data.room;
      if (!room || !connections[room]) return;

      const chatMessage = { sender, data, socketId: socket.id };
      messages[room] ??= [];
      messages[room].push(chatMessage);
      io.to(room).emit("chat-message", data, sender, socket.id);
    });

    socket.on("disconnect", () => {
      const room = socket.data.room;
      if (room) {
        removeFromRoom(room, socket);
      }
    });
  });

  function removeFromRoom(room, socket) {
    const clients = connections[room];
    if (!clients) return;

    socket.to(room).emit("user-left", socket.id);

    const index = clients.indexOf(socket.id);
    if (index !== -1) {
      clients.splice(index, 1);
    }

    if (clients.length === 0) {
      delete connections[room];
      delete messages[room];
    }
  }

  return io;
};
