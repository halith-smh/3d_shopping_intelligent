import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import { getResponse } from "../controllers/llm.controller.js";


const llmRouter = Router();

llmRouter.post("/get-response", authorize, getResponse);

export default llmRouter;