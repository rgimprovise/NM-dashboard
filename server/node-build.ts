import path from "path";
import { createServer } from "./index";
import * as express from "express";

const app = createServer();
const port = process.env.PORT || 3000;

// In production, serve the built SPA files
const __dirname = import.meta.dirname;
const distPath = path.join(__dirname, "../spa");

// Serve static files
app.use(express.static(distPath));

// Handle React Router - serve index.html for all non-API routes
// Use middleware without path pattern to catch all unmatched routes
// IMPORTANT: This must be LAST, after all API routes
app.use((req, res, next) => {
  // CRITICAL: Never serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    // If we reach here, the API route was not found
    // The 404 handler in createServer() should have handled it, but if not, return JSON error
    if (!res.headersSent) {
      console.warn(`⚠️ API route not handled: ${req.method} ${req.path}`);
      return res.status(404).json({
        success: false,
        error: `API endpoint not found: ${req.method} ${req.path}`,
      });
    }
    return next();
  }
  
  // Don't serve index.html for static assets (they should be handled by express.static)
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }

  // Serve index.html for SPA routing (React Router)
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) {
      next(err);
    }
  });
});

app.listen(port, () => {
  console.log(`🚀 NM Dashboard server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
