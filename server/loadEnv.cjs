// CommonJS file to load .env (works in both CommonJS and ES modules contexts)
const fs = require("fs");
const path = require("path");

function loadEnv() {
  try {
    const cwd = process.cwd();
    const envPaths = [
      path.resolve(cwd, ".env"),
      path.resolve(cwd, "..", ".env"),
    ];
    
    for (const envPath of envPaths) {
      try {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, "utf-8");
          envContent.split("\n").forEach((line) => {
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
          console.log("✅ .env loaded from:", envPath);
          return true;
        }
      } catch (err) {
        // Try next path
      }
    }
    
    console.warn("⚠️ .env file not found");
    return false;
  } catch (error) {
    console.warn("⚠️ Could not load .env:", error.message);
    return false;
  }
}

loadEnv();

// Also try dotenv as fallback
try {
  require("dotenv/config");
} catch {
  // Ignore
}

module.exports = { loadEnv };

