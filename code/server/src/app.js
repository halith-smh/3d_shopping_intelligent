import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiResponse } from "./utils/ApiResponse.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { NODE_ENV } from "./config/env.js";

const app = express();

// MiddleWares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(morgan(NODE_ENV));
app.use(cors());
// - Rate Limiting : production env

// App Roues
app.use("/api/v1/auth", authRouter);

// ErrorHandler Middleware
app.use(errorHandler);

app.get("/", (req, res) => {
  res.json(new ApiResponse(200,{status: "active", log: new Date()},"Site is running properly"));
});

export default app;
