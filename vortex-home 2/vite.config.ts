import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

// ES modules compatible __dirname
// Safe fallback if import.meta.url is not available
let __dirname: string;
try {
  if (typeof import.meta !== 'undefined' && import.meta.url) {
    const __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  } else {
    throw new Error("import.meta.url not available");
  }
} catch {
  // Fallback: use process.cwd() or current directory
  __dirname = (typeof process !== 'undefined' && process.cwd) ? process.cwd() : ".";
}

// Helper to detect if we should enable server plugin
// By default, server plugin is DISABLED for safety in cloud environments
// Enable it explicitly with ENABLE_VITE_SERVER=true
function shouldEnableServerPlugin(): boolean {
  try {
    // Must be Node.js environment
    if (typeof process === 'undefined' || !process?.env) {
      return false; // Not Node.js - disable
    }

    const env = process.env;
    
    // Explicitly enable with environment variable
    if (env.ENABLE_VITE_SERVER === 'true') {
      return true;
    }

    // Disable in known cloud/CI environments
    if (
      env.BUILDER_IO === 'true' ||
      env.VERCEL === 'true' ||
      env.NETLIFY === 'true' ||
      env.CI === 'true' ||
      env.GITHUB_ACTIONS === 'true' ||
      env.CODESPACES === 'true'
    ) {
      return false;
    }

    // Default: disable for safety (enable only in local dev with explicit flag)
    return false;
  } catch {
    // If any check fails, disable server plugin to be safe
    return false;
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const enableServer = shouldEnableServerPlugin();
  
  // Only include express plugin if explicitly enabled
  const plugins: Plugin[] = [react()];
  if (enableServer) {
    plugins.push(expressPlugin());
  }

  return {
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
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Early return for Builder.io and browser-like environments
      // Check multiple conditions to ensure we skip in Builder.io
      if (typeof window !== 'undefined') {
        return; // Browser environment - skip server
      }
      
      if (typeof process === 'undefined' || !process.env) {
        return; // Not Node.js - skip server
      }

      // Check for Builder.io specific environment variables or user agent
      if (process.env.BUILDER_IO === 'true' || 
          (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Builder'))) {
        return; // Builder.io detected - skip server
      }

      // Only load server in proper Node.js local development environment
      // Use setTimeout to defer loading and avoid blocking Vite initialization
      setTimeout(() => {
        import("./server/index.ts")
          .then((module) => {
            try {
              const { createServer } = module;
              const app = createServer();
              server.middlewares.use(app);
              console.log('✅ Express server middleware loaded');
            } catch (err) {
              // Silent fail - don't log to avoid Builder.io connection issues
            }
          })
          .catch(() => {
            // Silent fail - frontend-only mode is acceptable
          });
      }, 100); // Small delay to ensure Vite is ready
    },
  };
}
