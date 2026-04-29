// src/main/_server/ports/PostRegistry.js

const PostRegistry = {
  'uploadAsset': {
    factory: () => {
      // Merakit dependency (IoC)
      const driver = new SheetDriver(EnvConfig.get('SHEET_DB_ID'), 'ASSETS');
      const repo = new BaseSheetRepo(driver, ['id', 'fileId', 'fileName', 'url', 'uploader', 'size', 'status', 'createdAt', 'updatedAt']);
      
      const uow = new UnitOfWork(WriteGate);
      
      // Mengembalikan instance Service yang sudah dirakit
      return new AssetService(repo, uow, DriveManager);
    },
    method: 'uploadAsset',
    roles: ['PUBLIC'] // Sesuaikan dengan kebutuhan middleware
  }
};