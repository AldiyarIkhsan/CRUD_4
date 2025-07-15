import { Express, Request, Response } from "express";
import { blogValidationRules, handleInputErrors, basicAuthMiddleware } from "./middleware";
import { BlogModel } from "./models/BlogModel";

export const setupBlogs = (app: Express) => {
  app.get("/blogs", async (req: Request, res: Response) => {
    const {
      searchNameTerm,
      sortBy = "createdAt",
      sortDirection = "desc",
      pageNumber = "1",
      pageSize = "10",
    } = req.query as {
      searchNameTerm?: string;
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      pageNumber?: string;
      pageSize?: string;
    };

    const filter = searchNameTerm ? { name: { $regex: searchNameTerm, $options: "i" } } : {};

    const totalCount = await BlogModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / +pageSize);

    const blogs = await BlogModel.find(filter)
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip((+pageNumber - 1) * +pageSize)
      .limit(+pageSize);

    res.status(200).json({
      pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount,
      items: blogs.map((b) => ({
        id: b._id.toString(),
        name: b.name,
        description: b.description,
        websiteUrl: b.websiteUrl,
        isMembership: b.isMembership,
        createdAt: b.createdAt,
      })),
    });
  });

  app.get("/blogs/:id", async (req: Request, res: Response) => {
    const blog = await BlogModel.findById(req.params.id);
    if (!blog) return res.sendStatus(404);

    res.status(200).json({
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      isMembership: blog.isMembership,
      createdAt: blog.createdAt,
    });
  });

  app.post(
    "/blogs",
    basicAuthMiddleware,
    blogValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { name, description, websiteUrl, isMembership } = req.body;
      const newBlog = new BlogModel({ name, description, websiteUrl, isMembership });
      await newBlog.save();

      res.status(201).json({
        id: newBlog._id.toString(),
        name: newBlog.name,
        description: newBlog.description,
        websiteUrl: newBlog.websiteUrl,
        isMembership: newBlog.isMembership,
        createdAt: newBlog.createdAt,
      });
    },
  );

  app.put(
    "/blogs/:id",
    basicAuthMiddleware,
    blogValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { name, description, websiteUrl, isMembership } = req.body;
      const updated = await BlogModel.findByIdAndUpdate(
        req.params.id,
        { name, description, websiteUrl, isMembership },
        { new: true },
      );

      if (!updated) return res.sendStatus(404);
      res.sendStatus(204);
    },
  );

  app.delete("/blogs/:id", basicAuthMiddleware, async (req: Request, res: Response) => {
    const deleted = await BlogModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(204);
  });
};
