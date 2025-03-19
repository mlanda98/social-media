const express = require("express");
const prisma = require("../prismaClient");

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

router.post("/:userId", authenticateJWT, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;

    if (followerId === followingId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const existing = await prisma.follow.findFirst({
      where: { followerId, followingId },
    });

    if (existing) {
      if (existing.status === "pending") {
        return res.status(400).json({ message: "Request already sent" });
      }
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

router.post("/accept/:followId", authenticateJWT, async (req, res) => {
  try {
    const followId = req.params.followId;
    const userId = req.user.userId;

    const follow = await prisma.follow.findUnique({
      where: { id: followId },
    });

    if (follow.followingId !== userId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const updatedFollow = await prisma.follow.update({
      where: { id: followId },
      data: { status: "accepted" },
    });
    res.json({ message: "Follow request accepted", updatedFollow });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/reject/:followId", authenticateJWT, async (req, res) => {
  try {
    console.log("Authenticated user", req.user);
    const followId = req.params.followId;
    const userId = req.user.userId;

    const follow = await prisma.follow.findUnique({
      where: { id: followId },
    });

    if (!follow) {
      return res.status(404).json({ message: "Follow request not found" });
    }

    console.log("Following request found", follow);
    if (follow.followingId !== userId) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    await prisma.follow.delete({ where: { id: followId } });

    res.json({ message: "Follow request rejected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/unfollow/:userId", authenticateJWT, async (req, res) => {
  try {
    const followerId = req.user.userId;
    const followingId = req.params.userId;

    const follow = await prisma.follow.findFirst({
      where: { followerId, followingId },
    });

    if (!follow) {
      return res
        .status(404)
        .json({ message: "You are not following the user" });
    }
    await prisma.follow.delete({
      where: { id: follow.id },
    });

    res.json({ message: "Unfollowed user" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/count", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const followersCount = await prisma.follow.count({
      where: { followingId: userId, status: "accepted" },
    });

    const followingCount = await prisma.follow.count({
      where: { followerId: userId, status: "accepted" },
    });

    res.json({ followers: followersCount, following: followingCount });
  } catch (error) {
    console.error("Error fetching following counts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/followers", authenticateJWT, async (req, res) => {
  console.log("GET /followers route hit");
  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: req.user.userId, status: "accepted" },
      include: {
        follower: { select: { id: true, username: true, email: true } },
      },
    });

    console.log("followers from db", followers);
    console.log("followers count:", followers.length);
    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/following", authenticateJWT, async (req, res) => {
  try {
    const following = await prisma.follow.findMany({
      where: { followerId: req.user.userId, status: "accepted" },
      include: {
        following: { select: { id: true, username: true, email: true } },
      },
    });

    res.json(following);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/pending", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const pendingRequests = await prisma.follow.findMany({
      where: {
        followingId: userId,
        status: "pending",
      },
      include: {
        follower: true,
      },
    });
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/suggested-user", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.userId;

    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: { not: userId },
        NOT: {
          followers: {
            some: {
              followerId: userId,
              status: "accepted",
            },
          },
        },
      },
      select: { id: true, username: true, email: true, avatar: true },
    });
    res.json(suggestedUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
