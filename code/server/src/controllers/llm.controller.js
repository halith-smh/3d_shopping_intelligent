import axios from "axios";
import { ApiResponse } from "../utils/ApiResponse.js";
import { lipSync } from "../modules/lip-sync.mjs";
import { LLM_URI } from "../config/env.js";
import { ChatHistory } from "../models/chatHistory.js";

// Get LLM Response
export const getResponse = async (req, res, next) => {
  const { query, language } = req.body;
  const userId = req.user._id;
  console.log(language);

  try {
    let chatHistory = await ChatHistory.findOne({ userId });
    if (!chatHistory) {
      chatHistory = new ChatHistory({ userId, messages: [] });
    }

    // Add user message to history
    chatHistory.messages.push({ role: "user", content: query });
    await chatHistory.save();

    // History in the format the LLM expects
    const formattedHistory = chatHistory.messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const _getResponse = await axios.post(`${LLM_URI}/api/llm/response`, {
      query: query,
      language: language,
      history: formattedHistory, // Include the formatted history
    });

    if (_getResponse.data.messages && _getResponse.data.messages.length > 0) {
      const assistantResponse = _getResponse.data.messages
        .map((msg) => msg.text)
        .join(" ");

      chatHistory.messages.push({
        role: "assistant",
        content: assistantResponse,
      });

      // Update last interaction time
      chatHistory.lastInteraction = new Date();
      await chatHistory.save();
    }

    // Process lip sync
    const _lipSync = await lipSync({ messages: _getResponse.data.messages });

    // Send response to client
    res.send(
      new ApiResponse(
        200,
        _getResponse.data,
        `LLM response for the user query: ${query}`
      )
    );
  } catch (error) {
    console.error("Error in getResponse:", error);
    next(error);
  }
};

// Fetch chat history
export const getChatHistory = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const chatHistory = await ChatHistory.findOne({ userId });
    if (!chatHistory) {
      return res.send(
        new ApiResponse(200, { messages: [] }, "No chat history found")
      );
    }

    res.send(
      new ApiResponse(
        200,
        { messages: chatHistory.messages },
        "Chat history retrieved successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};

// Clear chat history
export const clearChatHistory = async (req, res, next) => {
  const userId = req.user._id;

  try {
    await ChatHistory.findOneAndUpdate(
      { userId },
      { $set: { messages: [] } },
      { new: true, upsert: true }
    );

    res.send(
      new ApiResponse(
        200,
        { success: true },
        "Chat history cleared successfully"
      )
    );
  } catch (error) {
    next(error);
  }
};
