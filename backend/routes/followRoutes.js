const express = require("express");
const prisma = require("../prismaClient");

const router = express.Router();

const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token" });
  }

  try {
    const decoded = jwt.verify(
      token.split(" ")[1],
      process.env.JWT_SECRET
    );
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

router.post("/follow/:userId", authenticateJWT, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId,
        status: "pending",
      },
    });
    res.status(201).json({ message: "Follow request sent", follow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/follow/accept/:followId", authenticateJWT, async (req, res) => {
  try {
    const followId = req.params.followId;

    const follow = await prisma.follow.update({
      where: { id: followId },
      data: { status: "accepted" },
    });

    res.json({ message: "Follow request accepted", follow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/follow/reject/:followId", authenticateJWT, async (req, res) => {
  try {
    const followId = req.params.followId;

    await prisma.follow.delete({ where: { id: followId } });

    res.json({ message: "Follow request rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/unfollow/:userId", authenticateJWT, async (req, res) => {
  try {
    const followerId = req.user.id;
    const followingId = req.params.userId;

    await prisma.follow.deleteMany({
      where: { 
        OR: [
          {followerId, followingId },
          {followerId: followingId, followingId: followerId}
        ],
      }
    });

    res.json({ message: "Unfollowed user" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/followers", authenticateJWT, async (req, res) => {
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: req.user.id, status: "accepted" },
      include: { follower: { select: { id, username, email } } },
    });

    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/following", authenticateJWT, async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.user.id, status: "accepted" },
      include: { following: { select: { id, username, email } } },
    });

    res.json(following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
