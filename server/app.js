require("dotenv").config();

const express = require("express");
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const teamRoutes = require("./routes/teams");
const invitationRoutes = require("./routes/invitations");
const { requireAuth } = require("./middleware/requireAuth");

const app = express();

app.use(express.json({ limit: "16kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/teams", requireAuth, teamRoutes);
app.use("/api/invitations", requireAuth, invitationRoutes);
app.use("/api/tasks", requireAuth, taskRoutes);

module.exports = { app };
