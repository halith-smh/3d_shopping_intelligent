import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
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
app.use(morgan(NODE_ENV === 'production'? 'combined' : 'dev'));
app.use(
  cors({
    origin: CLIENT_URI,
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  })
);
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15min
  max: 100
}));

// App Routes
app.use("/api/v1/auth", authRouter);
// User Routes
app.use("/api/v1/user", userRouter);
// llm response
app.use("/api/v1/llm", llmRouter);

app.get("/", (req, res) => {
  res.json(new ApiResponse(200, { status: "active" }, "Server operational"));
});

app.get("/health", async (req, res) => {
  try {
    const verifyLLM = await fetch(LLM_URI);
    if (verifyLLM.status == 200) {
      return res.status(200).json(new ApiResponse(200, { node_status: "active", llm_status: 'active' }, "Health check completed"));
    }
  } catch (error) {
    return res.status(500).json(new ApiResponse(500, { node_status: "active", llm_status: 'inactive'}, "Health check failed"));
  }
});

// ErrorHandler Middleware
app.use(errorHandler);


export default app;
