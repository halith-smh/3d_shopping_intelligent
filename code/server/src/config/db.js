import mongoose from "mongoose";
import { MONGO_URI, NODE_ENV } from "./env.js";
import chalk from "chalk";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(chalk.green('MongoDB connection established...'));
      } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
      }
}

export default connectDB;