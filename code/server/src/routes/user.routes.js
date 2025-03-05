import { Router } from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import { getHome } from "../controllers/user.controller.js";


const userRouter = Router();


userRouter.get("/home", authorize, getHome);

export default userRouter;