// models/chatHistory.js
import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ChatHistorySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    messages: [MessageSchema],
    lastInteraction: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export const ChatHistory = mongoose.model("ChatHistory", ChatHistorySchema);