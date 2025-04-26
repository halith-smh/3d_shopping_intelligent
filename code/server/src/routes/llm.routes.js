import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
  clearChatHistory,
  getChatHistory,
  getResponse,
} from "../controllers/llm.controller.js";
import sampleResponse from "../utils/sampleResponse.json" assert { type: "json" };

const llmRouter = Router();

llmRouter.post("/get-response", authorize, getResponse);
llmRouter.get("/chat-history", authorize, getChatHistory);
llmRouter.post("/clear-history", authorize, clearChatHistory);
llmRouter.post("/get-response/test", authorize, async (req, res) => {
  const data = sampleResponse;
  setTimeout(() => {
    res.status(200).send(data);
  }, 5000);
});

export default llmRouter;
