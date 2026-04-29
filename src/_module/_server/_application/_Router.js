// src/server/application/_Router.js

/**
 * Router
 * Single responsibility: Menerima request dari GAS, memproses via Pipeline, dan memanggil Service.
 */
class Router {
  static get(action, handlerKey, middlewares = []) {
    this._getRoutes = this._getRoutes || new Map();
    this._getRoutes.set(action, { handlerKey, middlewares });
  }

  static post(action, handlerKey, middlewares = [], roles = []) {
    this._postRoutes = this._postRoutes || new Map();
    this._postRoutes.set(action, { handlerKey, middlewares, roles });
  }

  static page(slug, templatePath, templateVars = {}) {
    this._pages = this._pages || new Map();
    this._pages.set(slug, { templatePath, templateVars });
  }

  // --- DISPATCHERS ---

static _jsonResponse(data, statusCode = 200) {
    const payload = JSON.stringify({
      success: statusCode >= 200 && statusCode < 300,
      data: data,
      timestamp: new Date().toISOString()
    });
    return ContentService.createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  }

  static _errorResponse(error) {
    // Manfaatkan AppError taxonomy yang udah lu bikin
    const statusCode = error.statusCode || 500;
    const payload = JSON.stringify({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Terjadi kesalahan sistem',
        details: error.details || null
      },
      timestamp: new Date().toISOString()
    });
    return ContentService.createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  }

  static dispatchGet(e) {
    try {
      const params = e ? e.parameter : {};
      const action = params.action || 'view';

      // 1. Mode Render HTML (View)
      if (action === 'view') {
        const slug = params.page || 'home';
        const pageData = this._pages.get(slug);
        
        if (!pageData) {
          return HtmlService.createHtmlOutput('<h1>404 - Page Not Found</h1>');
        }
        
        const template = HtmlService.createTemplateFromFile(pageData.templatePath);
        for (const [key, val] of Object.entries(pageData.templateVars)) {
          template[key] = val;
        }
        return template.evaluate()
          .setTitle('GAS Framework')
          .addMetaTag('viewport', 'width=device-width, initial-scale=1');
      }

      // 2. Mode API GET
      const route = this._getRoutes.get(action);
      if (!route) throw new NotFoundError(`Endpoint GET [${action}] tidak ditemukan.`);

      const result = this._executeRoute(route, params);
      return this._jsonResponse(result);

    } catch (error) {
      Logger.error(`GET Dispatch Error: ${error.message}`, { event: e }, error);
      return this._errorResponse(error);
    }
  }

  static dispatchPost(e) {
    try {
      if (!e || !e.postData) throw new ValidationError("Payload kosong");
      
      let payload;
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        throw new ValidationError("Format JSON tidak valid");
      }

      const action = payload.action;
      if (!action) throw new ValidationError("Parameter 'action' wajib ada di body POST");

      const route = this._postRoutes.get(action);
      if (!route) throw new NotFoundError(`Endpoint POST [${action}] tidak ditemukan.`);

      const result = this._executeRoute(route, payload);
      return this._jsonResponse(result);

    } catch (error) {
      Logger.error(`POST Dispatch Error: ${error.message}`, { event: e }, error);
      return this._errorResponse(error);
    }
  }

  static _executeRoute(route, requestData) {
    const context = {
      request: requestData,
      payload: requestData.data || requestData,
      route: route,
      response: null,
      user: null,
      isRejected: false,
      error: null,
      requiredRoles: route.roles || [],
      action: requestData.action
    };

    const pipeline = new Pipeline(route.middlewares || []);
    pipeline.runOrThrow(context);

    const service = route.factory ? route.factory() : Container.make(route.handlerKey);
    const methodToCall = route.method || 'execute';
    
    // Pastikan service mengembalikan data, lalu Router yang akan membungkusnya jadi JSON
    return service[methodToCall](context.payload);
  }
}