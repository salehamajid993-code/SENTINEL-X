import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { agentController } from "./server/agentController.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      service: "SENTINEL-X Incident Commander",
      timestamp: new Date().toISOString()
    });
  });

  // Get current state
  app.get("/api/agent/state", (req, res) => {
    res.json(agentController.getState());
  });

  // Start a new incident
  app.post("/api/agent/start", (req, res) => {
    const { goal, mode, supervised } = req.body || {};
    const state = agentController.startIncident(goal, mode || 'DEMO', supervised ?? true);
    res.json(state);
  });

  // Execute single step
  app.post("/api/agent/step", async (req, res) => {
    const state = await agentController.step();
    res.json(state);
  });

  // Run continuously
  app.post("/api/agent/run", async (req, res) => {
    // Start continuous execution asynchronously
    agentController.runContinuously().catch(err => {
      console.error("Error in continuous run:", err);
    });
    res.json(agentController.getState());
  });

  // Pause / stop run
  app.post("/api/agent/stop", (req, res) => {
    const state = agentController.stopContinuousRun();
    res.json(state);
  });

  // Approve or Reject pending high-risk action
  app.post("/api/agent/approve", async (req, res) => {
    const { approved } = req.body;
    const state = await agentController.approveAction(Boolean(approved));
    res.json(state);
  });

  // Reset environment
  app.post("/api/agent/reset", (req, res) => {
    const state = agentController.reset();
    res.json(state);
  });

  // Toggle Supervised mode
  app.post("/api/agent/supervised", (req, res) => {
    const { supervised } = req.body;
    const state = agentController.setSupervisedMode(Boolean(supervised));
    res.json(state);
  });

  // Server-Sent Events (SSE) stream for live updates
  app.get("/api/agent/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    // Send initial state
    res.write(`data: ${JSON.stringify(agentController.getState())}\n\n`);

    const unsubscribe = agentController.subscribe((state) => {
      res.write(`data: ${JSON.stringify(state)}\n\n`);
    });

    req.on("close", () => {
      unsubscribe();
      res.end();
    });
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`SENTINEL-X Server running on port ${PORT}`);
  });
}

startServer();
