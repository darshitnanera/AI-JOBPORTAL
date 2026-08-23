import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  attachments: [
    {
      url: String,
      filename: String,
      size: Number,
      type: String
    }
  ],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Index for faster queries
messageSchema.index({ chatId: 1, timestamp: -1 });
messageSchema.index({ sender: 1, timestamp: -1 });

export default mongoose.model("Message", messageSchema);
