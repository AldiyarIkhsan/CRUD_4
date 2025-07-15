// In setupTestingRoutes.ts
import { Express, Request, Response } from "express";
import { BlogModel } from "./models/BlogModel";
import { PostModel } from "./models/PostModel";

export const setupTestingRoutes = (app: Express) => {
  app.delete("/testing/all-data", async (_req: Request, res: Response) => {
    try {
      await Promise.all([BlogModel.deleteMany({}), PostModel.deleteMany({})]);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error clearing data:", error);
      res.sendStatus(500);
    }
  });
};
