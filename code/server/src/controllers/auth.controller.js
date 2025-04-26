import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { loginSchema, registerSchema } from "../utils/validator.js";
import jwt from "jsonwebtoken"
import { JWT_EXPIRES_IN, JWT_SECRET } from "../config/env.js";

export const signUp = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const {error} = registerSchema.validate({name, email, password});
    if (error){
        return res.status(400).send(new ApiResponse(400, "Failed to validate user input", error.details[0].message));
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send(new ApiResponse(400, "Failed to validate user input - Exsisting User", "Email is already exsisting"));
    }

    const user = await User.create({name, email, password});

    res.status(201).send(new ApiResponse(201, {userID: user._id, name: user.name, email: user.email}, "User registered successfully"));
  } catch (error) {
    next(error);
  }
};

export const signIn = async (req, res, next) => {
  const {email, password} = req.body;

  try {
    const {error} = loginSchema.validate({email, password});
    if (error){
        return res.status(400).send(new ApiResponse(400, "Failed to validate user input", error.details[0].message));
    }
  
    const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).send(new ApiResponse(404, "Failed to validate user input - User Not Fount: 404", "User account doesn't exsist"));
      }
  
      const verifyPassword = await bcrypt.compare(password, user.password);
  
      if (!verifyPassword){
          return res.status(403).send(new ApiResponse(403, "Failed to validate user input - Password Incorrect", "Invalid Password"));
      }
  
      const token = jwt.sign({userId: user._id}, JWT_SECRET, {expiresIn: JWT_EXPIRES_IN});
  
      res.status(200).send(new ApiResponse(200, {token, user: {userId: user._id, email: user.email, name: user.name}}, `${user.name} signed in successfully`))
  } catch (error) {
   next(error) 
  }

};

export const signOut = async (req, res) => {
  res.send({ message: "Logout Success" });
};
