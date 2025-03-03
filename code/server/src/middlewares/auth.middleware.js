import { JWT_SECRET } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

export const authorize = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) return res.status(401).send(new ApiResponse(401, "Error: Auth token not found", "Unauthorized"));

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if(!user) return res.status(401).json({success: false, message: 'Unauthorized'});

        req.user = user;
        
        next();
    } catch (error) {
        next(error);
    }
}