import express from "express";
import 'dotenv/config';

const app = express();

app.get("/", (req, res) => {
  res.send("<h1>Backend Server is Running...</h1>"); // Changed res.write() to res.send()
});

export default app;
