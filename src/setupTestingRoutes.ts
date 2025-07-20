import { Express, Request, Response } from "express";
import { BlogModel } from "./models/BlogModel";
import { PostModel } from "./models/PostModel";

export const setupTestingRoutes = (app: Express) => {
  app.delete("/testing/all-data", async (_req: Request, res: Response) => {
    await Promise.all([BlogModel.deleteMany({}), PostModel.deleteMany({})]);
    res.sendStatus(204);
  });
};
