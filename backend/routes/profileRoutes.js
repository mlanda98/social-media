const express = require("express");
const prisma = require("../prismaClient");
const crypto = require("crypto");

const router = express.Router();

const jwt = require("jsonwebtoken");
const { use } = require("passport");

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

router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          include: {
            likes: true,
            comments: {
              include: { author: { select: { username: true } } },
            },
          },
        },
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      id: user.id,
      username: user.username,
      avatar:
        user.avatar ||
        `https://www.gravatar.com/avatar/${crypto.createHash("md5").update(user.email.trim().toLowerCase()).digest("hex")}?d=identicon`,
      posts: user.posts.map((post) => ({
        id: post.id,
        content: post.content,
        likesCount: post.comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          author: comment.user.username,
        })),
        createdAt: post.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/profile", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        avatar,
      },
    });
    res.json({ message: "Profile updated", updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router