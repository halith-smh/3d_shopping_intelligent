import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";
import chalk from "chalk";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`${chalk.yellow('✔️  MongoDB Connected')}: ${conn.connection.host}`);
      } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        throw error;
      }
}

export default connectDB;