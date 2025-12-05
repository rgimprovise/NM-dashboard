import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: [".", "./client", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  build: {
    outDir: "dist/spa",
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Lazy import server only when needed (in configureServer, not at module load)
      // This prevents errors in Builder.io and other environments that may not support Node.js server code
      try {
        // Check if we're in a browser-like environment (Builder.io)
        // In Builder.io, process might exist but window might also exist
        if (typeof window !== 'undefined') {
          console.log('⚠️ Server plugin skipped: Browser-like environment detected');
          return;
        }

        // Check if we're in Node.js environment
        if (typeof process === 'undefined' || !process.env) {
          console.log('⚠️ Server plugin skipped: Not in Node.js environment');
          return;
        }

        // Dynamic import to avoid loading server code at config load time
        // Use relative path - Vite will resolve it correctly
        import("./server/index.ts")
          .then((module) => {
            const { createServer } = module;
            const app = createServer();

            // Add Express app as middleware to Vite dev server
            server.middlewares.use(app);
            console.log('✅ Express server middleware loaded');
          })
          .catch((error) => {
            // Silently fail if server can't be loaded (e.g., in Builder.io)
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn('⚠️ Could not load Express server middleware:', errorMessage);
            console.log('ℹ️  Running in frontend-only mode');
          });
      } catch (error) {
        // Fallback: continue without server if there's any error
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ Server plugin initialization failed:', errorMessage);
        console.log('ℹ️  Running in frontend-only mode');
      }
    },
  };
}
