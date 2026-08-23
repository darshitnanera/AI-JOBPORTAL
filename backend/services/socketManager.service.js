import Message from "../models/Message.model.js";
import Chat from "../models/Chat.model.js";

// Store active connections
const activeUsers = new Map(); // { userId: socketId }

export const setupSocketManager = (io) => {
  const messagesNamespace = io.of("/messages");

  messagesNamespace.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (userId) {
      activeUsers.set(userId, socket.id);
      console.log(`[Socket] User ${userId} connected with socket ${socket.id}`);

      // Broadcast user online status
      socket.broadcast.emit("user_online", { userId });
    }

    // Handle sending message
    socket.on("send_message", async (data, callback) => {
      try {
        const { chatId, content, attachments } = data;

        // Save message to database
        const message = new Message({
          chatId,
          sender: userId,
          content,
          attachments: attachments || [],
          isRead: false
        });

        await message.save();
        await message.populate("sender", "name email");

        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          lastMessageAt: new Date()
        });

        // Emit message to both participants in the chat
        messagesNamespace.to(chatId).emit("receive_message", {
          _id: message._id,
          chatId: message.chatId,
          sender: message.sender,
          content: message.content,
          timestamp: message.timestamp,
          isRead: message.isRead,
          attachments: message.attachments
        });

        // Callback to sender confirming delivery
        if (callback) {
          callback({
            success: true,
            messageId: message._id,
            timestamp: message.timestamp
          });
        }
      } catch (error) {
        console.error("[Socket] Error sending message:", error);
        if (callback) {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    // Handle user typing
    socket.on("typing", (data) => {
      const { chatId, isTyping } = data;
      socket.broadcast.to(chatId).emit("user_typing", {
        userId,
        isTyping
      });
    });

    // Handle message read
    socket.on("read_message", async (data) => {
      try {
        const { messageId } = data;

        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: new Date()
        });

        socket.broadcast.emit("message_read", {
          messageId,
          readAt: new Date()
        });
      } catch (error) {
        console.error("[Socket] Error marking message as read:", error);
      }
    });

    // Join chat room
    socket.on("join_chat", (data) => {
      const { chatId } = data;
      socket.join(chatId);
      console.log(`[Socket] User ${userId} joined chat ${chatId}`);
    });

    // Leave chat room
    socket.on("leave_chat", (data) => {
      const { chatId } = data;
      socket.leave(chatId);
      console.log(`[Socket] User ${userId} left chat ${chatId}`);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      if (userId) {
        activeUsers.delete(userId);
        socket.broadcast.emit("user_offline", { userId });
        console.log(`[Socket] User ${userId} disconnected`);
      }
    });
  });

  return activeUsers;
};

export const getActiveUsers = () => activeUsers;
