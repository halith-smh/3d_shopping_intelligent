import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiResponse } from "./utils/ApiResponse.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { NODE_ENV } from "./config/env.js";
import { authorize } from "./middlewares/auth.middleware.js";
import userRouter from "./routes/user.routes.js";

const app = express();

// MiddleWares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(morgan(NODE_ENV));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  })
);
// - Rate Limiting : production env

// App Routes
app.use("/api/v1/auth", authRouter);
// User Routes
app.use("/api/v1/user", userRouter);

// ErrorHandler Middleware
app.use(errorHandler);

app.get("/", authorize,(req, res) => {
  res.json(new ApiResponse(200,{status: "active", log: new Date()},"Site is running properly"));
});

export default app;
