// src/main/_server/core/AssetService.js

/**
 * AssetService (Core Domain)
 * Menangani logika bisnis upload dan pencatatan dokumen.
 */
class AssetService extends BaseService {
  constructor(repo, uow, driveManager) {
    super(repo);
    this.uow = uow;                 // Framework's UnitOfWork
    this.drive = driveManager;      // Framework's DriveManager
  }

  uploadAsset(payload) {
    // 1. Validasi Input (Framework's Validator)
    Validator.validate(payload, {
      fileName: { required: true, type: 'string' },
      base64: { required: true, type: 'string' },
      uploader: { required: true, type: 'string' }
    });

    // Validasi ekstensi dari AppConfig
    const ext = payload.fileName.split('.').pop().toLowerCase();
    if (!AppConfig.drive.allowedExtensions.includes(ext)) {
      throw new AppError(`Ekstensi ${ext} tidak diizinkan`, 'VALIDATION_ERROR', 400);
    }

    // 2. Operasi Drive (Bisa di luar transaksi DB karena file fisik)
    const targetFolderId = AppConfig.drive.targetFolderId;
    const uploadedFile = this.drive.uploadBase64(payload.base64, payload.fileName, targetFolderId);
    
    // Set permission agar bisa diakses
    this.drive.grantAccess(uploadedFile.id, null, 'VIEWER');

    // 3. Persiapkan Entitas
    const assetEntity = new BaseEntity({
      fileId: uploadedFile.id,
      fileName: uploadedFile.name,
      url: uploadedFile.url,
      uploader: payload.uploader,
      size: uploadedFile.size,
      status: 'ACTIVE'
    });

    // 4. Transaksi Database dengan UnitOfWork
    return this.uow.commit(() => {
      // Simpan metadata ke Spreadsheet via Repo
      const savedData = this.repo.create(assetEntity.toJSON());
      
      // Daftarkan Event untuk Listeners (Kirim email & Log)
      this.uow.registerEvent('ASSET_UPLOADED', savedData);
      
      return {
        message: "Aset berhasil diamankan",
        data: savedData
      };
    });
  }
}