const express = require("express");
const prisma = require("../prismaClient");
const router = express.Router();

const jwt = require("jsonwebtoken");
const { authorize } = require("passport");

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

router.post("/create", authenticateJWT, async (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  try {
    const post = await prisma.post.create({
      data: {
        content,
        authorId: req.user.userId,
      },
    });
    res.status(201).json({ message: "Post created successfully", post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/like/:postId", authenticateJWT, async (req, res) => {
  const postId = req.params.postId;
  const userId = req.user.userId;

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingLike = await prisma.like.findFirst({
      where: { postId, userId },
    });

    if (existingLike) {
      return res.status(400).json({ message: "You already liked this post" });
    }

    const like = await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });
    res.status(201).json({ message: "Post liked", like });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/comment/:postId", authenticateJWT, async (req, res) => {
  const { content } = req.body;
  const postId = req.params.postId;
  const userId = req.user.userId;

  if (!content) {
    return res.status(400).json({ message: "Comment content is required" });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        userId,
      },
    });
    res.status(201).json({ message: "Comment added", comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, username: true } },
        likes: {
          select: { id: true, userId: true },
        },
        comments: {
          include: {
            author: { select: { id: true, username: true } },
          },
        },
      },
    });

    console.log("Posts data:", posts)
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      author: post.author.username,
      likesCount: post.likes.length,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author.username,
      })),
      createdAt: post.createdAt,
    }));
    res.json(formattedPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/feed", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const following = await prisma.follow.findMany({
      where: { followerId: userId, status: "accepted" },
      select: { followingId: true },
    });

    const followerIds = following.map((f) => f.followingId);

    followerIds.push(userId);

    const posts = await prisma.post.findMany({
      where: { authorId: { in: followerIds } },
      include: {
        author: {
          select: { id: true, username: true },
        },
        likes: {
          select: { id: true, userId: true },
        },
        comments: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedPosts = posts.map((post) => ({
      id: post.id,
      content: post.content,
      author: post.author.username,
      likesCount: post.likes.length,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        author: comment.user.username,
      })),
      createdAt: post.createdAt,
    }));

    res.json(formattedPosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error(error);
  }
});
module.exports = router;
