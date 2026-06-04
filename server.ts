/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { DisplayState, ShowcaseImage } from "./src/types";

// Default premium exhibition assets
const DEFAULT_IMAGES: ShowcaseImage[] = [
  {
    id: "ex_1",
    url: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1600&q=80",
    title: "SPECTRE GT COUPE",
    subtitle: "Aerodynamic Concept 04",
    description: "An advanced luxury electric hypercar engineered with zero-resistance silhouette and intelligent active biometrics.",
    category: "LUXURY AUTOMOBILE",
    colorTheme: "#066D55" // Deep Emerald
  },
  {
    id: "ex_2",
    url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80",
    title: "AUREUM PAVILION",
    subtitle: "Monolithic Glass Matrix",
    description: "An awards-winning luxury pavilion celebrating architectural physics, dynamic gold structural accents, and linear light reflections.",
    category: "MODERN ARCHITECTURE",
    colorTheme: "#AB844C" // Primary Gold
  },
  {
    id: "ex_3",
    url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1600&q=80",
    title: "NEBULA CORE",
    subtitle: "Generative Hologram 09",
    description: "Curated dark particle stream simulation projecting cosmic matter expansion onto immersive ultra-bright museum projection domes.",
    category: "DIGITAL ART",
    colorTheme: "#838C4A" // Olive Green
  },
  {
    id: "ex_4",
    url: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&w=1600&q=80",
    title: "VERDANT INTERIOR",
    subtitle: "Organic Biophilic Sanctuary",
    description: "Indoor organic display synthesizing ambient acoustic forestry signals with a glowing physical canopy layout.",
    category: "BIOPHILIC INSTALLATION",
    colorTheme: "#4F9244" // Fresh Green
  },
  {
    id: "ex_5",
    url: "https://images.unsplash.com/photo-1545987796-200677ee1011?auto=format&fit=crop&w=1600&q=80",
    title: "CHRONOS REEF",
    subtitle: "Complex Synaptic Network",
    description: "An abstract algorithmic matrix mimicking neural connections, casting a radiant soft olive and golden glow on obsidian stones.",
    category: "TECH SHOWCASE",
    colorTheme: "#838C4A" // Olive Green
  }
];

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing payloads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // In-memory state serving as our single-source of truth (database)
  let state: DisplayState = {
    currentImageIndex: 0,
    images: [...DEFAULT_IMAGES],
    connectedClients: 0,
    lastUpdated: Date.now()
  };

  // Keep track of connected clients for Server-Sent Events (SSE)
  let sseClients: any[] = [];

  // Broadcast function to notify all displays & controllers updated state
  const broadcastState = () => {
    state.lastUpdated = Date.now();
    state.connectedClients = sseClients.length;
    const sseMessage = `data: ${JSON.stringify(state)}\n\n`;
    sseClients.forEach((client) => {
      client.res.write(sseMessage);
    });
  };

  // Serve uploads folder statically
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- API Routes ---

  // Get current state
  app.get("/api/state", (req, res) => {
    res.json(state);
  });

  // Update current active image index
  app.post("/api/state/index", (req, res) => {
    const { index } = req.body;
    if (typeof index === "number" && index >= 0 && index < state.images.length) {
      state.currentImageIndex = index;
      broadcastState();
      res.json({ success: true, state });
    } else {
      res.status(400).json({ error: "Invalid image index" });
    }
  });

  // Reorder images
  app.post("/api/state/reorder", (req, res) => {
    const { images } = req.body;
    if (Array.isArray(images)) {
      state.images = images;
      // Clamp index if it became out of bounds
      if (state.currentImageIndex >= state.images.length) {
        state.currentImageIndex = Math.max(0, state.images.length - 1);
      }
      broadcastState();
      res.json({ success: true, state });
    } else {
      res.status(400).json({ error: "Invalid images schema" });
    }
  });

  // Delete an image
  app.delete("/api/state/image/:id", (req, res) => {
    const { id } = req.params;
    const initialLength = state.images.length;
    const currentActiveImage = state.images[state.currentImageIndex];

    state.images = state.images.filter((img) => img.id !== id);

    if (state.images.length === 0) {
      // Restore default image if all empty so the screen never blanks out catastrophically
      state.images = [...DEFAULT_IMAGES];
    }

    // Adapt current index so it points to the correct/closest image
    if (currentActiveImage) {
      const newIdx = state.images.findIndex((img) => img.id === currentActiveImage.id);
      if (newIdx !== -1) {
        state.currentImageIndex = newIdx;
      } else {
        state.currentImageIndex = Math.min(state.currentImageIndex, state.images.length - 1);
      }
    } else {
      state.currentImageIndex = Math.min(state.currentImageIndex, state.images.length - 1);
    }
    state.currentImageIndex = Math.max(0, state.currentImageIndex);

    broadcastState();
    res.json({ success: true, state });
  });

  // Handle high-velocity base64 file uploads directly onto the server disk
  app.post("/api/upload", (req, res) => {
    try {
      const { fileName, base64Data, title, subtitle, description, category, colorTheme } = req.body;

      if (!fileName || !base64Data) {
        return res.status(400).json({ error: "Missing required upload parameters" });
      }

      // Filter off base64 content prefix (e.g., data:image/png;base64,) if present
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(cleanBase64, "base64");

      const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const safeFileName = `${uniquePrefix}-${path.basename(fileName).replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(UPLOADS_DIR, safeFileName);

      fs.writeFileSync(filePath, buffer);

      const serverUrl = `/uploads/${safeFileName}`;

      const newImage: ShowcaseImage = {
        id: `upload_${uniquePrefix}`,
        url: serverUrl,
        title: title || "USER EXHIBIT",
        subtitle: subtitle || "Uploaded via Tablet Controller",
        description: description || "Manually introduced exhibition installation media file.",
        category: category || "GALLERY SUBMISSION",
        colorTheme: colorTheme || "#AB844C" // Default gold
      };

      state.images.push(newImage);
      // Set to current image index for immediate activation
      state.currentImageIndex = state.images.length - 1;

      broadcastState();
      res.json({ success: true, image: newImage, state });
    } catch (uploadError) {
      console.error("Upload error in server:", uploadError);
      res.status(500).json({ error: "Failed to persist uploaded image" });
    }
  });

  // SSE real-time synchronization stream
  app.get("/api/sync", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Prevent Nginx buffering standard stream

    // Immediately trigger a state push upon establishing handshake
    res.write(`data: ${JSON.stringify(state)}\n\n`);

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    // Update state to count active screens
    broadcastState();

    req.on("close", () => {
      sseClients = sseClients.filter((client) => client.id !== clientId);
      broadcastState();
    });
  });

  // Setup client routing
  if (process.env.NODE_ENV !== "production") {
    // Development Mode using Vite middleware Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode serving assets statically
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    // Support single page application fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gate Display System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
