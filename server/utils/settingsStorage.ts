/**
 * Settings Storage Manager
 * 
 * Manages persistent storage of API settings (tokens, IDs, etc.)
 * Settings are stored in data/settings.json and override environment variables
 */

import fs from "fs";
import path from "path";

export interface ApiSettings {
  yandex: {
    token: string | null;
    campaignIds: string[];
    businessId: string | null;
  };
  vk: {
    token: string | null;
    refreshToken: string | null;
    accountId: string | null;
    clientId: string | null;
    clientSecret: string | null;
    expiresAt: number | null;
  };
  updatedAt: string;
}

const DEFAULT_SETTINGS: ApiSettings = {
  yandex: {
    token: null,
    campaignIds: [],
    businessId: null,
  },
  vk: {
    token: null,
    refreshToken: null,
    accountId: null,
    clientId: null,
    clientSecret: null,
    expiresAt: null,
  },
  updatedAt: new Date().toISOString(),
};

/**
 * Get the path to settings.json file
 */
function getSettingsPath(): string {
  const cwd = process.cwd();
  return path.resolve(cwd, "data", "settings.json");
}

/**
 * Ensure data directory exists
 */
function ensureDataDir(): void {
  try {
    const cwd = process.cwd();
    const dataDir = path.resolve(cwd, "data");
    if (!fs.existsSync(dataDir)) {
      console.log("📁 Creating data directory:", dataDir);
      fs.mkdirSync(dataDir, { recursive: true });
      console.log("✅ Data directory created");
    }
  } catch (error) {
    console.error("❌ Error creating data directory:", error);
    throw new Error(`Failed to create data directory: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Load settings from file, falling back to environment variables
 */
export function loadSettings(): ApiSettings {
  const settingsPath = getSettingsPath();
  
  // Try to load from file first
  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, "utf-8");
      const fileSettings = JSON.parse(content) as ApiSettings;
      
      // Merge with env vars (file takes priority, but fallback to env)
      return mergeWithEnv(fileSettings);
    } catch (error) {
      console.warn("⚠️ Could not parse settings.json:", error);
    }
  }
  
  // Fallback to environment variables only
  return getSettingsFromEnv();
}

/**
 * Get settings from environment variables
 */
function getSettingsFromEnv(): ApiSettings {
  return {
    yandex: {
      token: process.env.YANDEX_TOKEN || null,
      campaignIds: (process.env.YANDEX_CAMPAIGN_IDS || "")
        .split(",")
        .map(id => id.trim())
        .filter(Boolean),
      businessId: process.env.YANDEX_BUSINESS_ID || null,
    },
    vk: {
      token: process.env.VK_TOKEN || null,
      refreshToken: process.env.VK_REFRESH_TOKEN || null,
      accountId: process.env.VK_ACCOUNT_ID || null,
      clientId: process.env.VK_CLIENT_ID || null,
      clientSecret: process.env.VK_CLIENT_SECRET || null,
      expiresAt: process.env.VK_TOKEN_EXPIRES_AT 
        ? parseInt(process.env.VK_TOKEN_EXPIRES_AT, 10) 
        : null,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Merge file settings with environment variables
 * File settings take priority, env vars are fallback
 */
function mergeWithEnv(fileSettings: ApiSettings): ApiSettings {
  const envSettings = getSettingsFromEnv();
  
  return {
    yandex: {
      token: fileSettings.yandex.token || envSettings.yandex.token,
      campaignIds: fileSettings.yandex.campaignIds.length > 0 
        ? fileSettings.yandex.campaignIds 
        : envSettings.yandex.campaignIds,
      businessId: fileSettings.yandex.businessId || envSettings.yandex.businessId,
    },
    vk: {
      token: fileSettings.vk.token || envSettings.vk.token,
      refreshToken: fileSettings.vk.refreshToken || envSettings.vk.refreshToken,
      accountId: fileSettings.vk.accountId || envSettings.vk.accountId,
      clientId: fileSettings.vk.clientId || envSettings.vk.clientId,
      clientSecret: fileSettings.vk.clientSecret || envSettings.vk.clientSecret,
      expiresAt: fileSettings.vk.expiresAt || envSettings.vk.expiresAt,
    },
    updatedAt: fileSettings.updatedAt,
  };
}

/**
 * Save settings to file
 */
export function saveSettings(settings: Partial<ApiSettings>): ApiSettings {
  try {
    ensureDataDir();
    const settingsPath = getSettingsPath();
    
    // Load existing settings first
    const currentSettings = loadSettings();
    
    // Merge with new settings
    const updatedSettings: ApiSettings = {
      yandex: {
        ...currentSettings.yandex,
        ...(settings.yandex || {}),
      },
      vk: {
        ...currentSettings.vk,
        ...(settings.vk || {}),
      },
      updatedAt: new Date().toISOString(),
    };
    
    // Save to file
    try {
      fs.writeFileSync(settingsPath, JSON.stringify(updatedSettings, null, 2), "utf-8");
      console.log("✅ Settings saved to:", settingsPath);
    } catch (writeError) {
      console.error("❌ Error writing settings file:", writeError);
      throw new Error(`Failed to write settings file: ${writeError instanceof Error ? writeError.message : String(writeError)}`);
    }
    
    // Also update environment variables so they're immediately available
    try {
      if (updatedSettings.yandex.token) {
        process.env.YANDEX_TOKEN = updatedSettings.yandex.token;
      }
      if (updatedSettings.yandex.campaignIds.length > 0) {
        process.env.YANDEX_CAMPAIGN_IDS = updatedSettings.yandex.campaignIds.join(",");
      }
      if (updatedSettings.yandex.businessId) {
        process.env.YANDEX_BUSINESS_ID = updatedSettings.yandex.businessId;
      }
      if (updatedSettings.vk.token) {
        process.env.VK_TOKEN = updatedSettings.vk.token;
      }
      if (updatedSettings.vk.accountId) {
        process.env.VK_ACCOUNT_ID = updatedSettings.vk.accountId;
      }
      if (updatedSettings.vk.clientId) {
        process.env.VK_CLIENT_ID = updatedSettings.vk.clientId;
      }
      if (updatedSettings.vk.clientSecret) {
        process.env.VK_CLIENT_SECRET = updatedSettings.vk.clientSecret;
      }
    } catch (envError) {
      console.warn("⚠️ Warning: Could not update environment variables:", envError);
      // Don't throw - this is not critical
    }
    
    return updatedSettings;
  } catch (error) {
    console.error("❌ Error in saveSettings:", error);
    throw error; // Re-throw to be handled by caller
  }
}

/**
 * Get settings for Yandex API
 */
export function getYandexSettings() {
  const settings = loadSettings();
  return settings.yandex;
}

/**
 * Get settings for VK API
 */
export function getVKSettings() {
  const settings = loadSettings();
  return settings.vk;
}

/**
 * Update Yandex settings
 */
export function updateYandexSettings(yandexSettings: Partial<ApiSettings["yandex"]>): ApiSettings {
  return saveSettings({ yandex: yandexSettings as ApiSettings["yandex"] });
}

/**
 * Update VK settings
 */
export function updateVKSettings(vkSettings: Partial<ApiSettings["vk"]>): ApiSettings {
  return saveSettings({ vk: vkSettings as ApiSettings["vk"] });
}

/**
 * Check if settings file exists
 */
export function settingsFileExists(): boolean {
  return fs.existsSync(getSettingsPath());
}

/**
 * Delete settings file (reset to env vars)
 */
export function resetSettings(): void {
  const settingsPath = getSettingsPath();
  if (fs.existsSync(settingsPath)) {
    fs.unlinkSync(settingsPath);
    console.log("✅ Settings file deleted, falling back to environment variables");
  }
}

