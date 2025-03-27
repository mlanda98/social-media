const express = require("express");
const prisma = require("../prismaClient");
const router = express.Router();

const jwt = require("jsonwebtoken");
const { authorize, use } = require("passport");

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
    
    const updatedPost = await prisma.post.findUnique({
      where: {id: postId},
      include: {likes: true},
    })
    res.status(201).json({ message: "Post liked", post: {
      id: updatedPost.id,
      content: updatedPost.content,
      likesCount: updatedPost.likes.length,
    }
     });
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
        post: {connect: {id: postId}},
        author: {connect: {id: userId}},
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

    console.log("Posts data:", posts);
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

router.get("/user/:username", authenticateJWT, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        posts: true,
        _count: {
          select: {
            followers: true,
            following: true,
          },
        },
      },
    });

    const posts = await prisma.post.findMany({
      where: { authorId: user.id },
      include: {
        author: {
          select: { id: true, username: true },
        },
        likes: {
          select: { id: true, userId: true },
        },
        comments: {
          include: {
            author: { select: { id: true, username: true } },
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
        author: comment.author.username,
      })),
      createdAt: post.createdAt,
    }));

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      posts: formattedPosts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error(error);
  }
});
module.exports = router;
