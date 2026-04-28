// src/server/infrastructure/logging/_Logger.js

/**
 * Logger (Facade)
 * Single responsibility: Mencatat aktivitas, error, dan audit trail.
 */
class Logger {
  static _repo = null;

  /**
   * Inject repository dari Kernel/Container saat aplikasi booting.
   */
  static setRepository(repo) {
    this._repo = repo;
  }

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
    if (EnvConfig.get('APP_ENV') !== 'dev') return;
    if (this._repo) this._repo.write(this._buildEntry('DEBUG', message, context));
  }

  static info(message, context = {}) {
    if (this._repo) this._repo.write(this._buildEntry('INFO', message, context));
  }

  static warn(message, context = {}) {
    if (this._repo) this._repo.write(this._buildEntry('WARN', message, context));
  }

  static error(message, context = {}, errorObj = null) {
    const stack = errorObj instanceof Error ? errorObj.stack : '-';
    if (this._repo) this._repo.write(this._buildEntry('ERROR', message, context, 'ERROR_THROWN', 'SYSTEM', stack));
  }

  static audit(actor, action, entity, entityId, before, after) {
    const context = { entity, entityId, before, after };
    if (this._repo) this._repo.write(this._buildEntry('AUDIT', `Perubahan pada ${entity}`, context, action, actor));
  }
}