import io from "socket.io-client";

let socket = null;

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const initializeSocket = (userId) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    namespace: "/messages",
    query: {
      userId: userId
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
  });

  socket.on("connect", () => {
    console.log("[Socket] Connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("[Socket] Disconnected");
  });

  socket.on("error", (error) => {
    console.error("[Socket] Error:", error);
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Message events
export const sendMessage = (chatId, content, attachments = []) => {
  return new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error("Socket not initialized"));
      return;
    }

    socket.emit("send_message", {
      chatId,
      content,
      attachments
    }, (response) => {
      if (response.success) {
        resolve(response);
      } else {
        reject(new Error(response.error || "Failed to send message"));
      }
    });
  });
};

export const onReceiveMessage = (callback) => {
  if (!socket) return;
  socket.on("receive_message", callback);
};

export const offReceiveMessage = (callback) => {
  if (!socket) return;
  socket.off("receive_message", callback);
};

// Typing events
export const sendTyping = (chatId, isTyping) => {
  if (!socket) return;
  socket.emit("typing", { chatId, isTyping });
};

export const onUserTyping = (callback) => {
  if (!socket) return;
  socket.on("user_typing", callback);
};

export const offUserTyping = (callback) => {
  if (!socket) return;
  socket.off("user_typing", callback);
};

// Read status
export const markMessageAsRead = (messageId) => {
  if (!socket) return;
  socket.emit("read_message", { messageId });
};

export const onMessageRead = (callback) => {
  if (!socket) return;
  socket.on("message_read", callback);
};

export const offMessageRead = (callback) => {
  if (!socket) return;
  socket.off("message_read", callback);
};

// Chat room events
export const joinChat = (chatId) => {
  if (!socket) return;
  socket.emit("join_chat", { chatId });
};

export const leaveChat = (chatId) => {
  if (!socket) return;
  socket.emit("leave_chat", { chatId });
};

// User status
export const onUserOnline = (callback) => {
  if (!socket) return;
  socket.on("user_online", callback);
};

export const onUserOffline = (callback) => {
  if (!socket) return;
  socket.on("user_offline", callback);
};

export const offUserOnline = (callback) => {
  if (!socket) return;
  socket.off("user_online", callback);
};

export const offUserOffline = (callback) => {
  if (!socket) return;
  socket.off("user_offline", callback);
};
