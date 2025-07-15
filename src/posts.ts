import { Express, Request, Response } from "express";
import mongoose from "mongoose";
import {
  postValidationRules,
  handleInputErrors,
  basicAuthMiddleware,
} from "./middleware";
import { PostModel } from "./models/PostModel";
import { BlogModel } from "./models/BlogModel";
import { check } from "express-validator";

// 👇 Только для POST /blogs/:id/posts (без blogId в теле)
const nestedPostValidationRules = [
  check("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 30 })
    .withMessage("Title should be max 30 characters"),
  check("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .isLength({ max: 100 })
    .withMessage("Short description should be max 100 characters"),
  check("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 1000 })
    .withMessage("Content should be max 1000 characters"),
];

export const setupPosts = (app: Express) => {
  app.get("/posts", async (req: Request, res: Response) => {
    const {
      sortBy = "createdAt",
      sortDirection = "desc",
      pageNumber = "1",
      pageSize = "10",
    } = req.query as {
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      pageNumber?: string;
      pageSize?: string;
    };

    const totalCount = await PostModel.countDocuments();
    const pagesCount = Math.ceil(totalCount / +pageSize);

    const posts = await PostModel.find()
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip((+pageNumber - 1) * +pageSize)
      .limit(+pageSize);

    res.status(200).json({
      pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount,
      items: posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        shortDescription: p.shortDescription,
        content: p.content,
        blogId: p.blogId.toString(),
        blogName: p.blogName,
        createdAt: p.createdAt,
      })),
    });
  });

  app.get("/posts/:id", async (req: Request, res: Response) => {
    const post = await PostModel.findById(req.params.id);
    if (!post) return res.sendStatus(404);

    res.status(200).json({
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt,
    });
  });

  app.post(
    "/posts",
    basicAuthMiddleware,
    postValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { title, shortDescription, content, blogId } = req.body;
      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        return res
          .status(400)
          .send({ errorsMessages: [{ message: "Invalid blogId", field: "blogId" }] });
      }

      const newPost = new PostModel({
        title,
        shortDescription,
        content,
        blogId,
        blogName: blog.name,
      });

      await newPost.save();

      res.status(201).json({
        id: newPost._id.toString(),
        title: newPost.title,
        shortDescription: newPost.shortDescription,
        content: newPost.content,
        blogId: newPost.blogId.toString(),
        blogName: newPost.blogName,
        createdAt: newPost.createdAt,
      });
    }
  );

  app.put(
    "/posts/:id",
    basicAuthMiddleware,
    postValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const { title, shortDescription, content, blogId } = req.body;
      const blog = await BlogModel.findById(blogId);
      if (!blog) {
        return res
          .status(400)
          .send({ errorsMessages: [{ message: "Invalid blogId", field: "blogId" }] });
      }

      const updated = await PostModel.findByIdAndUpdate(
        req.params.id,
        {
          title,
          shortDescription,
          content,
          blogId,
          blogName: blog.name,
        },
        { new: true }
      );

      if (!updated) return res.sendStatus(404);
      res.sendStatus(204);
    }
  );

  app.delete("/posts/:id", basicAuthMiddleware, async (req: Request, res: Response) => {
    const deleted = await PostModel.findByIdAndDelete(req.params.id);
    if (!deleted) return res.sendStatus(404);
    res.sendStatus(204);
  });

  app.get("/blogs/:id/posts", async (req: Request, res: Response) => {
    const blogId = req.params.id;
    const {
      sortBy = "createdAt",
      sortDirection = "desc",
      pageNumber = "1",
      pageSize = "10",
    } = req.query as {
      sortBy?: string;
      sortDirection?: "asc" | "desc";
      pageNumber?: string;
      pageSize?: string;
    };

    const blog = await BlogModel.findById(blogId);
    if (!blog) return res.sendStatus(404);

    const filter = { blogId };

    const totalCount = await PostModel.countDocuments(filter);
    const pagesCount = Math.ceil(totalCount / +pageSize);

    const posts = await PostModel.find(filter)
      .sort({ [sortBy]: sortDirection === "asc" ? 1 : -1 })
      .skip((+pageNumber - 1) * +pageSize)
      .limit(+pageSize);

    res.status(200).json({
      pagesCount,
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount,
      items: posts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        shortDescription: p.shortDescription,
        content: p.content,
        blogId: p.blogId.toString(),
        blogName: p.blogName,
        createdAt: p.createdAt,
      })),
    });
  });

  app.post(
    "/blogs/:id/posts",
    basicAuthMiddleware,
    nestedPostValidationRules,
    handleInputErrors,
    async (req: Request, res: Response) => {
      const blogId = req.params.id;

      if (!mongoose.Types.ObjectId.isValid(blogId)) {
        return res.sendStatus(404);
      }

      const blog = await BlogModel.findById(blogId);
      if (!blog) return res.sendStatus(404);

      const { title, shortDescription, content } = req.body;

      const newPost = new PostModel({
        title,
        shortDescription,
        content,
        blogId,
        blogName: blog.name,
      });

      await newPost.save();

      res.status(201).json({
        id: newPost._id.toString(),
        title: newPost.title,
        shortDescription: newPost.shortDescription,
        content: newPost.content,
        blogId: newPost.blogId.toString(),
        blogName: newPost.blogName,
        createdAt: newPost.createdAt,
      });
    }
  );
};
