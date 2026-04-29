// src/main/server/controllers/FileController.js

/**
 * FileController
 * Handler untuk routing HTTP (Web/API)
 */
class FileController {
  constructor(fileService) {
    this.fileService = fileService;
  }

  /**
   * Endpoint POST: action=upload
   * Payload: { action: "upload", data: { base64: "...", fileName: "doc.pdf", mimeType: "application/pdf" } }
   */
  upload(payload) {
    if (!payload.base64 || !payload.fileName) {
      throw new Error("Parameter base64 dan fileName wajib diisi");
    }
    const result = this.fileService.uploadFile(payload);
    return { message: "File berhasil diunggah dan dicatat", data: result };
  }

  /**
   * Endpoint POST: action=delete
   * Payload: { action: "delete", data: { fileId: "xxxx" } }
   */
  delete(payload) {
    if (!payload.fileId) {
      throw new Error("Parameter fileId wajib diisi");
    }
    const result = this.fileService.deleteFile(payload.fileId);
    return { message: "File berhasil dihapus dan dicatat", data: result };
  }

  /**
   * Endpoint GET: action=list
   * Payload: (none, diambil dari URL params)
   */
  list() {
    const files = this.fileService.listFiles();
    return { message: "Berhasil mengambil daftar file", data: files };
  }
}
