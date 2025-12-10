/**
 * PM2 Ecosystem Configuration
 * 
 * Используется для запуска приложения на VPS с правильной загрузкой .env
 */

module.exports = {
  apps: [
    {
      name: "nm-dashboard",
      script: "npm",
      args: "start",
      // cwd will be set automatically by PM2 to the directory where config file is located
      env_file: ".env",
      env: {
        NODE_ENV: "production",
      },
      // Автоматически перезапускать при сбое
      autorestart: true,
      // Максимальное количество перезапусков
      max_restarts: 10,
      // Минимальное время между перезапусками (мс)
      min_uptime: "10s",
      // Максимальное время между перезапусками (мс)
      max_memory_restart: "1G",
      // Логи
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      // Объединять логи
      merge_logs: true,
      // Время для graceful shutdown
      kill_timeout: 5000,
    },
  ],
};

