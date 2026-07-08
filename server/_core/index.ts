import "dotenv/config";
import express from "express";
import { insertSensorReading, upsertDevice, createAlert } from "../db";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // ─── ESP8266 REST Endpoints ───────────────────────────────────────────────
  // POST /api/sensor — called by ESP8266 with JSON body
  app.post("/api/sensor", async (req, res) => {
    try {
      const { deviceId, temperature, humidity, soilMoisture, light } = req.body ?? {};
      if (!deviceId) return res.status(400).json({ success: false, error: "deviceId required" });
      await upsertDevice({ deviceId, status: "online", lastSeen: new Date() });
      await insertSensorReading({ deviceId, temperature, humidity, soilMoisture, light });
      if (temperature !== undefined && temperature > 40)
        await createAlert({ type: "high_temp", message: `อุณหภูมิสูงเกินกำหนด: ${temperature}°C`, value: temperature, threshold: 40 });
      if (soilMoisture !== undefined && soilMoisture < 20)
        await createAlert({ type: "low_soil", message: `ความชื้นดินต่ำเกินเกณฑ์: ${soilMoisture}%`, value: soilMoisture, threshold: 20 });
      if (humidity !== undefined && humidity < 20)
        await createAlert({ type: "low_humidity", message: `ความชื้นอากาศต่ำเกินเกณฑ์: ${humidity}%`, value: humidity, threshold: 20 });
      return res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err) {
      console.error("[ESP8266 API]", err);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  });
  // GET /api/device/:deviceId/command — ESP8266 polls for pump command
  app.get("/api/device/:deviceId/command", async (req, res) => {
    try {
      const { getDeviceById } = await import("../db");
      const device = await getDeviceById(req.params.deviceId);
      if (!device) return res.status(404).json({ error: "Device not found" });
      return res.json({ pumpStatus: device.pumpStatus, mode: device.mode });
    } catch (err) {
      console.error("[Device Command API]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
