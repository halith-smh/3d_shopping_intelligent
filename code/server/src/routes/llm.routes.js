import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import { getResponse } from "../controllers/llm.controller.js";
import sampleResponse from '../utils/sampleResponse.json' assert { type: 'json' };
import { ApiResponse } from "../utils/ApiResponse.js";


const llmRouter = Router();

llmRouter.post("/get-response", authorize, getResponse);
llmRouter.post("/get-response/test", authorize, async (req, res) => {
    const data = sampleResponse; // already a JS object
    res.status(200).send(data); 
});

export default llmRouter;