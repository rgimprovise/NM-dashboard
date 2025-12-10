// Development server - simplified version without static file serving
import { createServer } from "./index";

const app = createServer();
const port = process.env.PORT || 3000;

// In development, we don't serve static files (Vite handles that)
// Only API routes are handled here

app.listen(port, () => {
  console.log(`🚀 NM Dashboard API server running on port ${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
  console.log(`📱 Frontend: http://localhost:5173 (Vite dev server)`);
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

