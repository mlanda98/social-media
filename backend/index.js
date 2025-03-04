const cors = require("cors");
const express = require("express");
const passport = require("../backend/passportConfig");
const authRoutes = require("./routes/authRoutes");
const followRoutes = require("./routes/followRoutes");
const postRoutes = require("./routes/postRoutes");
const profileRoutes = require("./routes/profileRoutes");

require("dotenv").config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/follow", followRoutes);
app.use("/post", postRoutes);
app.use("/profile", profileRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on portal ${PORT}`));
