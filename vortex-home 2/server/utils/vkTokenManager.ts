/**
 * VK Token Manager - Автоматическое обновление токенов VK Ads API
 * 
 * Функционал:
 * - Проверка срока действия токена
 * - Автоматическое обновление через refresh_token
 * - Сохранение новых токенов в .env
 */

import fs from 'fs';
import path from 'path';

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // timestamp когда истечет
}

const VK_CLIENT_ID = process.env.VK_CLIENT_ID || 'b9AHG7669xtg1nvq';
const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || '';

let tokenCache: TokenData | null = null;

/**
 * Загрузить токены из переменных окружения
 */
export function loadTokens(): TokenData | null {
  const accessToken = process.env.VK_TOKEN;
  const refreshToken = process.env.VK_REFRESH_TOKEN;
  const expiresAt = process.env.VK_TOKEN_EXPIRES_AT;

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt ? parseInt(expiresAt) : Date.now() + 24 * 60 * 60 * 1000,
  };
}

/**
 * Сохранить токены в .env файл
 */
export function saveTokens(tokens: TokenData): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    let envContent = '';

    // Читаем существующий .env
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    // Обновляем токены
    const updateEnvVar = (content: string, key: string, value: string): string => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}="${value}"`);
      } else {
        return content + `\n${key}="${value}"`;
      }
    };

    envContent = updateEnvVar(envContent, 'VK_TOKEN', tokens.access_token);
    envContent = updateEnvVar(envContent, 'VK_REFRESH_TOKEN', tokens.refresh_token);
    envContent = updateEnvVar(envContent, 'VK_TOKEN_EXPIRES_AT', tokens.expires_at.toString());

    // Сохраняем
    fs.writeFileSync(envPath, envContent, 'utf-8');

    // Обновляем process.env
    process.env.VK_TOKEN = tokens.access_token;
    process.env.VK_REFRESH_TOKEN = tokens.refresh_token;
    process.env.VK_TOKEN_EXPIRES_AT = tokens.expires_at.toString();

    // Обновляем кеш
    tokenCache = tokens;

    console.log('✅ VK токены обновлены и сохранены в .env');
  } catch (error) {
    console.error('❌ Ошибка сохранения токенов:', error);
  }
}

/**
 * Обновить токен используя refresh_token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenData | null> {
  try {
    console.log('🔄 Обновление VK токена через refresh_token...');

    const response = await fetch('https://ads.vk.com/api/v2/oauth2/token.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: VK_CLIENT_ID,
        client_secret: VK_CLIENT_SECRET,
      }).toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ VK refresh token error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    if (!data.access_token) {
      console.error('❌ VK refresh response missing access_token:', data);
      return null;
    }

    const newTokens: TokenData = {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken, // Используем старый если новый не пришел
      expires_at: Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000), // -5 минут для запаса
    };

    // Сохраняем новые токены
    saveTokens(newTokens);

    console.log('✅ VK токен успешно обновлен');
    return newTokens;
  } catch (error) {
    console.error('❌ Ошибка обновления VK токена:', error);
    return null;
  }
}

/**
 * Проверить не истек ли токен, обновить если нужно
 */
export async function ensureValidToken(): Promise<string | null> {
  // Проверяем кеш
  if (!tokenCache) {
    tokenCache = loadTokens();
  }

  if (!tokenCache) {
    console.warn('⚠️ VK токены не настроены');
    return null;
  }

  // Проверяем не истек ли токен (или истечет в ближайшие 30 минут)
  const now = Date.now();
  const timeUntilExpiry = tokenCache.expires_at - now;
  const thirtyMinutes = 30 * 60 * 1000;

  if (timeUntilExpiry > thirtyMinutes) {
    // Токен еще действителен
    return tokenCache.access_token;
  }

  // Токен истек или скоро истечет - обновляем
  console.log('⏰ VK токен истекает, обновляем...');
  const newTokens = await refreshAccessToken(tokenCache.refresh_token);

  if (!newTokens) {
    console.error('❌ Не удалось обновить VK токен');
    // Возвращаем старый токен, может еще работает
    return tokenCache.access_token;
  }

  return newTokens.access_token;
}

/**
 * Инициализировать токен менеджер при старте сервера
 */
export function initTokenManager(): void {
  console.log('🔧 Инициализация VK Token Manager...');
  
  const tokens = loadTokens();
  if (tokens) {
    tokenCache = tokens;
    const hoursUntilExpiry = (tokens.expires_at - Date.now()) / (1000 * 60 * 60);
    console.log(`✅ VK токен загружен (действителен еще ${hoursUntilExpiry.toFixed(1)} часов)`);
  } else {
    console.warn('⚠️ VK токены не найдены в .env');
  }
}

