import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
  clearChatHistory,
  getChatHistory,
  getResponse,
} from "../controllers/llm.controller.js";
import fs from 'fs/promises';
import path from 'path';

const llmRouter = Router();

llmRouter.post("/get-response", authorize, getResponse);
llmRouter.get("/chat-history", authorize, getChatHistory);
llmRouter.post("/clear-history", authorize, clearChatHistory);
llmRouter.post("/get-response/test", authorize, async (req, res) => {
  try {
    const filePath = path.join(process.cwd(), 'src', 'utils', 'sampleResponse.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(data);
    
    setTimeout(() => {
      res.status(200).json(jsonData);
    }, 5000);
  } catch (error) {
    console.error('Error reading JSON file:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default llmRouter;
