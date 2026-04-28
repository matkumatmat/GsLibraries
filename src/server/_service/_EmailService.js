// src/server/_services/_EmailService.js

/**
 * EmailService
 * Single responsibility: Utilitas agnostik untuk pengiriman Email.
 */
class EmailService {
  /**
   * Mengirim email secara synchronous
   */
  static send({ to, subject, body, htmlBody = null, attachments = [] }) {
    try {
      const options = {};
      if (htmlBody) options.htmlBody = htmlBody;
      if (attachments.length > 0) options.attachments = attachments;

      // Catat log sebelum ngirim (siapa tau gagal)
      Logger.info(`Mencoba mengirim email ke ${to}`, { subject });

      GmailApp.sendEmail(to, subject, body, options);
      
      return true;
    } catch (e) {
      Logger.error(`Gagal mengirim email ke ${to}`, { subject }, e);
      throw new AppError(`Pengiriman email gagal: ${e.message}`, 'EMAIL_ERROR', 500);
    }
  }

  /**
   * Mengirim email menggunakan HtmlService template.
   * Template harus disimpan di file .html (misal: 'src/server/_templates/email_otp.html')
   */
  static sendTemplate({ to, subject, templateName, templateVars = {} }) {
    try {
      const template = HtmlService.createTemplateFromFile(templateName);
      
      // Inject variabel ke dalam template
      for (const key in templateVars) {
        template[key] = templateVars[key];
      }
      
      const htmlBody = template.evaluate().getContent();
      return this.send({ to, subject, body: 'Browser Anda tidak mendukung HTML email.', htmlBody });
    } catch (e) {
      throw new AppError(`Gagal memuat template email ${templateName}: ${e.message}`, 'EMAIL_TPL_ERROR', 500);
    }
  }
}