// src/main/_server/config/AppConfig.js

/**
 * AppConfig (Statis)
 * Konfigurasi berjenjang ala YAML, menyimpan pengaturan yang tidak rahasia.
 */
const AppConfig = {
  app: {
    name: "DocumentHub Enterprise",
    version: "1.0.0",
    timezone: "Asia/Jakarta"
  },
  drive: {
    targetFolderId: "15EJnHvEXvm9a0cGgzR8ZAR4E56ce3iwT",
    allowedExtensions: ["pdf", "png", "jpg", "xlsx", "csv"],
    maxSizeMB: 10
  },
  mail: {
    adminEmail: "admin@perusahaan.com",
    notificationTemplate: "EmailNotification" // Nama file HTML di clients/
  }
};