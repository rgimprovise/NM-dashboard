// Load environment variables BEFORE importing anything else
// Use createRequire for ES modules compatibility
import { createRequire } from "module";
const require = createRequire(import.meta.url);

let envLoaded = false;
try {
  if (typeof process !== 'undefined' && process.env) {
    const fs = require("fs");
    const path = require("path");
    
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line: string) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const [key, ...valueParts] = trimmed.split("=");
          if (key && valueParts.length > 0) {
            let value = valueParts.join("=").trim();
            value = value.replace(/^["']|["']$/g, "");
            process.env[key.trim()] = value;
          }
        }
      });
      envLoaded = true;
      console.log("✅ vite.config.ts: .env loaded manually");
    }
  }
} catch (error) {
  console.warn("⚠️ vite.config.ts: Could not load .env:", error);
}

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
      console.log('🔧 Express plugin: configureServer called');
      console.log('🔧 ENABLE_VITE_SERVER:', process.env.ENABLE_VITE_SERVER);
      
      // Early return for Builder.io and browser-like environments
      if (typeof window !== 'undefined') {
        console.log('⚠️ Express plugin: Browser environment detected, skipping');
        return;
      }
      
      if (typeof process === 'undefined' || !process.env) {
        console.log('⚠️ Express plugin: Not Node.js environment, skipping');
        return;
      }

      // Check for Builder.io specific environment variables
      if (process.env.BUILDER_IO === 'true' || 
          (typeof navigator !== 'undefined' && navigator.userAgent?.includes('Builder'))) {
        console.log('⚠️ Express plugin: Builder.io detected, skipping');
        return;
      }

      // Load server with proper error handling
      // Use require for synchronous loading in Node.js context
      try {
        console.log('🔄 Express plugin: Loading server module...');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const serverModule = require("./server/index.ts");
        const { createServer } = serverModule;
        const app = createServer();
        server.middlewares.use(app);
        console.log('✅ Express server middleware loaded and registered');
      } catch (error) {
        console.error('❌ Express plugin: Error loading server:', error);
        // Try async import as fallback
        import("./server/index.ts")
          .then((module) => {
            try {
              const { createServer } = module;
              const app = createServer();
              server.middlewares.use(app);
              console.log('✅ Express server middleware loaded (async fallback)');
            } catch (err) {
              console.error('❌ Express plugin: Error in async fallback:', err);
            }
          })
          .catch((err) => {
            console.error('❌ Express plugin: Async import also failed:', err);
          });
      }
    },
  };
}
