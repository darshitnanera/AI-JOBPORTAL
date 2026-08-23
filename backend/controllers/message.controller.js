import Message from "../models/Message.model.js";
import Chat from "../models/Chat.model.js";
import User from "../models/user.model.js";

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, attachments } = req.body;
    const userId = req.user._id;

    if (!chatId || !content) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and content are required"
      });
    }

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    const isParticipant = chat.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to send message in this chat"
      });
    }

    // Create message
    const message = new Message({
      chatId,
      sender: userId,
      content,
      attachments: attachments || [],
      isRead: false
    });

    await message.save();
    await message.populate("sender", "name email");

    // Update chat
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: new Date(),
      updatedAt: new Date()
    });

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get chat history with a specific user
export const getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { page = 1, limit = 50 } = req.query;

    // Find or create chat between two users
    let chat = await Chat.findOne({
      participants: {
        $all: [currentUserId, userId],
        $size: 2
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "No chat found"
      });
    }

    // Get paginated messages
    const messages = await Message.find({ chatId: chat._id })
      .populate("sender", "name email")
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalMessages = await Message.countDocuments({ chatId: chat._id });

    return res.status(200).json({
      success: true,
      data: {
        chat: {
          _id: chat._id,
          participants: chat.participants,
          createdAt: chat.createdAt
        },
        messages: messages.reverse(),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalMessages / limit),
          totalMessages
        }
      }
    });
  } catch (error) {
    console.error("Error getting chat history:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get all conversations for user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    // Get all chats for this user
    const chats = await Chat.find({
      participants: userId
    })
      .populate("participants", "name email")
      .populate({
        path: "lastMessage",
        select: "content sender timestamp",
        populate: {
          path: "sender",
          select: "name email"
        }
      })
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const totalChats = await Chat.countDocuments({
      participants: userId
    });

    // Format response with unread counts
    const conversations = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chatId: chat._id,
          sender: { $ne: userId },
          isRead: false
        });

        return {
          chatId: chat._id,
          participants: chat.participants,
          lastMessage: chat.lastMessage,
          lastMessageAt: chat.lastMessageAt,
          unreadCount,
          createdAt: chat.createdAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        conversations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalChats / limit),
          totalChats
        }
      }
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unreadCount = await Message.countDocuments({
      chatId: {
        $in: await Chat.find({
          participants: userId
        }).select("_id")
      },
      sender: { $ne: userId },
      isRead: false
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount }
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findByIdAndUpdate(
      messageId,
      {
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    ).populate("sender", "name email");

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Mark all messages in chat as read
export const markChatAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    // Verify user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found"
      });
    }

    const isParticipant = chat.participants.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "Not authorized"
      });
    }

    await Message.updateMany(
      {
        chatId,
        sender: { $ne: userId },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    return res.status(200).json({
      success: true,
      message: "All messages marked as read"
    });
  } catch (error) {
    console.error("Error marking chat as read:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Start new chat with user
export const startChat = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const userId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: "Recipient ID is required"
      });
    }

    // Verify recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found"
      });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: {
        $all: [userId, recipientId],
        $size: 2
      }
    }).populate("participants", "name email");

    // Create new chat if doesn't exist
    if (!chat) {
      chat = new Chat({
        participants: [userId, recipientId]
      });
      await chat.save();
      await chat.populate("participants", "name email");
    }

    return res.status(200).json({
      success: true,
      message: "Chat started",
      data: chat
    });
  } catch (error) {
    console.error("Error starting chat:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete message (soft delete)
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found"
      });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this message"
      });
    }

    await Message.findByIdAndUpdate(messageId, {
      deletedAt: new Date(),
      content: "[Message deleted]"
    });

    return res.status(200).json({
      success: true,
      message: "Message deleted"
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
