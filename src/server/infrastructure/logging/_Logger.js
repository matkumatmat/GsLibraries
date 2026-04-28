// src/server/infrastructure/logging/_Logger.js

/**
 * Logger
 * Single responsibility: Mencatat aktivitas, error, dan audit trail ke dalam sistem log.
 */
class Logger {
  static _buildEntry(severity, message, context, action = 'SYSTEM_PROCESS', actor = 'SYSTEM', stack = '-') {
    return {
      id: Utilities.getUuid(),
      timestamp: new Date(),
      severity,
      actor,
      action,
      message,
      context,
      stack
    };
  }

  static debug(message, context = {}) {
    if (EnvConfig.get('APP_ENV') !== 'dev') return; // Cuma nyatet debug di dev
    LogRepository.write(this._buildEntry('DEBUG', message, context));
  }

  static info(message, context = {}) {
    LogRepository.write(this._buildEntry('INFO', message, context));
  }

  static warn(message, context = {}) {
    LogRepository.write(this._buildEntry('WARN', message, context));
  }

  static error(message, context = {}, errorObj = null) {
    const stack = errorObj instanceof Error ? errorObj.stack : '-';
    LogRepository.write(this._buildEntry('ERROR', message, context, 'ERROR_THROWN', 'SYSTEM', stack));
  }

  /**
   * Audit Trail khusus untuk mencatat perubahan data.
   */
  static audit(actor, action, entity, entityId, before, after) {
    const context = { entity, entityId, before, after };
    LogRepository.write(this._buildEntry('AUDIT', `Perubahan pada ${entity}`, context, action, actor));
  }
}