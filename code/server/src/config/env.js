import "dotenv/config";

export const {
  NODE_ENV,
  PORT,
  MONGO_URI,
  SALT,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  ELEVEN_LABS_API_KEY,
  ELEVEN_LABS_VOICE_ID,
  ELEVEN_LABS_MODEL_ID,
} = process.env;
