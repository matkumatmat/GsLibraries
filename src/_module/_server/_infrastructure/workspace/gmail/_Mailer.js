// src/server/infrastructure/workspace/gmail/_Mailer.js

class Mailer {
  /**
   * Mengirim email secara synchronous dengan dukungan Enterprise.
   * @param {Object} params
   * @param {string} params.to - Alamat email tujuan (bisa dipisah koma untuk multiple)
   * @param {string} [params.cc] - Carbon Copy
   * @param {string} [params.bcc] - Blind Carbon Copy
   * @param {string} [params.fromAlias] - Kirim atas nama email lain (harus terdaftar di setting Gmail)
   * @param {string} params.subject - Subjek email
   * @param {string} params.body - Teks biasa (fallback)
   * @param {string} [params.htmlBody] - Isi email HTML
   * @param {Array<GoogleAppsScript.Base.Blob|Object>} [params.attachments] - Array Blob
   * @param {Object} [params.inlineImages] - Objek mapping CID ke Blob (misal: { logo: imageBlob })
   */
  static send({ to, cc, bcc, fromAlias, subject, body, htmlBody = null, attachments = [], inlineImages = {} }) {
    try {
      const options = this._buildOptions({ cc, bcc, fromAlias, htmlBody, attachments, inlineImages });
      
      Logger.info(`Mencoba mengirim email ke ${to}`, { subject, fromAlias });
      GmailApp.sendEmail(to, subject, body, options);
      return true;
    } catch (e) {
      Logger.error(`Gagal mengirim email ke ${to}`, { subject }, e);
      throw new AppError(`Pengiriman email gagal: ${e.message}`, 'EMAIL_ERROR', 500);
    }
  }

  /**
   * MEMBUAT DRAFT: Sangat berguna jika email butuh direview manual oleh manusia sebelum dikirim.
   */
  static createDraft({ to, cc, bcc, fromAlias, subject, body, htmlBody = null, attachments = [], inlineImages = {} }) {
    try {
      const options = this._buildOptions({ cc, bcc, fromAlias, htmlBody, attachments, inlineImages });
      
      const draft = GmailApp.createDraft(to, subject, body, options);
      return {
        id: draft.getId(),
        messageId: draft.getMessageId()
      };
    } catch (e) {
      throw new AppError(`Gagal membuat draft email: ${e.message}`, 'EMAIL_DRAFT_ERROR', 500);
    }
  }

  /**
   * Cek alias apa saja yang berhak digunakan oleh akun ini
   */
  static getAvailableAliases() {
    return GmailApp.getAliases();
  }

  // --- Helper Internal ---
  static _buildOptions({ cc, bcc, fromAlias, htmlBody, attachments, inlineImages }) {
    const options = {};
    if (cc) options.cc = cc;
    if (bcc) options.bcc = bcc;
    if (htmlBody) options.htmlBody = htmlBody;
    if (fromAlias) {
      // Validasi alias agar tidak crash
      const aliases = GmailApp.getAliases();
      if (aliases.includes(fromAlias)) {
        options.from = fromAlias;
      } else {
        Logger.warn(`Alias ${fromAlias} tidak diizinkan. Menggunakan email default.`);
      }
    }
    
    // Proses Attachments
    if (attachments && attachments.length > 0) {
      options.attachments = attachments.map(att => {
        if (att.base64 && att.fileName) {
          const rawBase64 = att.base64.includes(',') ? att.base64.split(',')[1] : att.base64;
          return Utilities.newBlob(Utilities.base64Decode(rawBase64), att.mimeType || 'application/pdf', att.fileName);
        }
        return att;
      });
    }

    // Proses Inline Images (Untuk menempelkan logo di dalam HTML <img src="cid:logo">)
    if (inlineImages && Object.keys(inlineImages).length > 0) {
      options.inlineImages = inlineImages;
    }

    return options;
  }
}