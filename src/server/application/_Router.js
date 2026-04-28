// src/server/application/_Router.js

/**
 * Router
 * Single responsibility: Menerima request dari GAS, memproses via Pipeline, dan memanggil Service.
 */
class Router {
  static _getRoutes = new Map();
  static _postRoutes = new Map();
  static _pages = new Map();

  // --- REGISTRATION ---

  static get(action, handlerKey, middlewares = []) {
    this._getRoutes.set(action, { handlerKey, middlewares });
  }

  static post(action, handlerKey, middlewares = [], roles = []) {
    this._postRoutes.set(action, { handlerKey, middlewares, roles });
  }

  static page(slug, templatePath, templateVars = {}) {
    this._pages.set(slug, { templatePath, templateVars });
  }

  // --- DISPATCHERS ---

  static dispatchGet(e) {
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
      // Inject vars
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

    return this._executeRoute(route, params);
  }

  static dispatchPost(e) {
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

    return this._executeRoute(route, payload);
  }

  static _executeRoute(route, requestData) {
    // Siapkan context untuk middleware
    const context = {
      request: requestData,
      response: null,
      user: null,
      isRejected: false,
      error: null,
      requiredRoles: route.roles || []
    };

    // Jalankan Pipeline (Middleware)
    const pipeline = new Pipeline(route.middlewares);
    pipeline.runOrThrow(context);

    // Resolve Service dari Container & eksekusi
    const service = Container.make(route.handlerKey);
    return service.execute(context.request);
  }
}