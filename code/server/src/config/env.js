import "dotenv/config";

export const {NODE_ENV, PORT, MONGO_URI, SALT, JWT_SECRET, JWT_EXPIRES_IN} = process.env;