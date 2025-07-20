import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./db";
import { setupBlogs } from "./blogs";
import { setupPosts } from "./posts";
import { setupTestingRoutes } from "./setupTestingRoutes";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("API is running");
});

setupTestingRoutes(app);
setupBlogs(app);
setupPosts(app);

const start = async () => {
  await connectDB();
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`🚀 Server is running on port ${port}`);
  });
};

start();
