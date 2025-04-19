import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiResponse } from "./utils/ApiResponse.js";
import { errorHandler } from "./middlewares/error.middleware.js";

import { CLIENT_URI, LLM_URI, NODE_ENV } from "./config/env.js";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import llmRouter from "./routes/llm.routes.js";

const app = express();

// MiddleWares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(morgan(NODE_ENV));
app.use(
  cors({
    origin: CLIENT_URI,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  })
);
// - Rate Limiting : production env

// App Routes
app.use("/api/v1/auth", authRouter);
// User Routes
app.use("/api/v1/user", userRouter);
// llm response
app.use("/api/v1/llm", llmRouter);

app.get("/", (req, res) => {
  res.json(new ApiResponse(200, { status: "active", log: new Date() }, "Backend server is running properly"));
});

app.get("/health", async (req, res) => {
  try {
    const verifyLLM = await fetch(LLM_URI);
    if (verifyLLM.status == 200) {
      const response = await verifyLLM.json();
      return res.json(new ApiResponse(200, { Node_status: "active", LLM_status: 'active', LLM_Response: response, log: new Date() }, "Servers are running properly"));
    }
  } catch (error) {
    return res.json(new ApiResponse(500, { Node_status: "active", LLM_status: 'in_active', log: new Date() }, "LLM server is not running properly"));
  }
});

// ErrorHandler Middleware
app.use(errorHandler);


export default app;
