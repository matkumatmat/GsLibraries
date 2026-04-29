// src/main/_server/adapters/AssetUploadedListener.js

class AssetUploadedListener extends BaseListener {
  static get eventName() { return 'ASSET_UPLOADED'; }

  static handle(payload) {
    // 1. Catat Log ke sistem menggunakan Framework Logger
    Logger.audit(payload.uploader, 'UPLOAD_ASSET', 'Asset', payload.id, null, payload);

    // 2. Kirim Notifikasi Email menggunakan Framework Mailer
    const adminEmail = AppConfig.mail.adminEmail;
    
    Mailer.send({
      to: adminEmail,
      subject: `[${AppConfig.app.name}] File Baru Diunggah: ${payload.fileName}`,
      body: `Pengguna ${payload.uploader} telah mengunggah file baru.\nURL: ${payload.url}`
    });
  }
}