const express = require("express");
const passport = require("../backend/passportConfig");
const authRoutes = require("./routes/authRoutes");
const followRoutes = require("./routes/followRoutes");

require("dotenv").config();
const app = express();

app.use(express.json());
app.use(passport.initialize());

app.use("/auth", authRoutes);
app.use("/api", followRoutes)

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on portal ${PORT}`));
