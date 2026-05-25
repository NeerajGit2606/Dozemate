require("dotenv").config();

// 🔑 sanitize JWT secret early (before routes/controllers use it)
if (process.env.JWT_SECRET) {
  process.env.JWT_SECRET = process.env.JWT_SECRET.trim();
} else {
  console.error("❌ JWT_SECRET is missing!");
}

const express = require("express");
const cors = require("cors");
const cron = require("node-cron");

const connectDB = require("./config/db");
const { logger } = require("./utils/logger");
const { updateAllDeviceStatuses } = require("./utils/deviceStatusManagement");
const { verifySmtp } = require('./utils/mailer');

// routes
const publicPendingRoutes = require("./routes/publicPending");
const authRoutes = require("./routes/auth");
const deviceRoutes = require("./routes/device");
// const { router: mqttRoutes, connectMQTT } = require("./routes/mqtt");
const protectedRoutes = require("./routes/protectedRoutes");
const userRoutes = require("./routes/userProfileRoutes");
const organizationRoutes = require("./routes/organizationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userManagementRoutes = require("./routes/userManagementRoutes");
const deviceManagementRoutes = require("./routes/deviceManagementRoutes");
const httpRoutes = require("./routes/http");
const devicePrefixesRouter = require('./routes/devicePrefixes');
const profileRoutes = require("./routes/profileRoutes");
const app = express();

/* ───────────────────────── Middleware ───────────────────────── */
app.use(cors());
app.use(express.json());

// request log (after json, before routes)
app.use((req, res, next) => {
  res.on("finish", () => {
    logger.req(req, { status: res.statusCode });
  });
  next();
});

app.use("/uploads", express.static("uploads"));

/* ───────────────────────── Routes ───────────────────────── */
// mount PUBLIC routes before protected if they share /api prefix

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Dozemate API is running 🚀" });
});

app.use("/api/public", publicPendingRoutes);
app.use("/api/auth", authRoutes);            // ← keep only this one
app.use("/api/devices", deviceRoutes);
// app.use("/api/mqtt", mqttRoutes);
app.use("/api/user", userRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/manage/users", userManagementRoutes);
app.use("/api/manage/devices", deviceManagementRoutes);
app.use("/api/http", httpRoutes);
app.use("/api", profileRoutes);

// keep protected catch-all last
app.use("/api/graph-settings", require("./routes/graphSettings"));
app.use("/api/device-prefixes", devicePrefixesRouter);
app.use("/api", protectedRoutes);


/* 404 */
app.use((req, res) => {
  const err = new Error("Route not found");
  err.statusCode = 404;
  logger.err(err, { route: req.originalUrl, method: req.method });
  res.status(404).json({ status: "fail", message: "Route not found" });
});

/* ─────────────────────── Error handling ─────────────────────── */
app.use((err, req, res, next) => {
  logger.err(err, {
    route: req.originalUrl,
    body: { ...req.body, password: undefined, newPassword: undefined, currentPassword: undefined },
    params: req.params,
    query: req.query,
    userId: req.user?.userId,
  });
  if (res.headersSent) return next(err);
  res.status(err.statusCode || 500).json({ status: "error", message: err.message || "Internal Server Error" });
});

// process-level safety nets
process.on("uncaughtException", (err) => logger.err(err, { scope: "uncaughtException" }));
process.on("unhandledRejection", (reason) =>
  logger.err(reason instanceof Error ? reason : new Error(String(reason)), { scope: "unhandledRejection" })
);

/* ───────────────────────── Boot ───────────────────────── */
const PORT = process.env.PORT || 5000;

connectDB()
  .then(async () => {
    verifySmtp()
      .then(() => logger.info('📧 SMTP verify OK'))
      .catch((err) => logger.err(err, { where: 'smtp-verify-startup' }));

    app.listen(PORT, () => logger.info(`✅ Server running on port ${PORT}`));

    // MQTT after server is up
    // connectMQTT();

    // hourly device status updates
    cron.schedule("0 * * * *", async () => {
      logger.info("📊 Running scheduled device status update...");
      try {
        const result = await updateAllDeviceStatuses();
        logger.info("✅ Device status update complete", { result });
      } catch (error) {
        logger.err(error, { where: "cron:updateAllDeviceStatuses" });
      }
    });

    // run once on startup
    updateAllDeviceStatuses()
      .then((result) => logger.info("✅ Initial device status update complete", { result }))
      .catch((error) => logger.err(error, { where: "initial:updateAllDeviceStatuses" }));
  })
  .catch((err) => {
    logger.err(err, { where: "connectDB" });
    process.exit(1);
  });

module.exports = app;
