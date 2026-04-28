// src/main.js

// 1. Daftarkan AuthService ke dalam Container
Container.bind('AuthService', () => {
  return new AuthService();
});

// 2. Entry Point GET (Read)
function doGet(e) {
  try {
    const params = e ? e.parameter : {};
    const method = params.method || 'client';

    if (method === 'fetch') {
      const action = params.action;
      if (!action) throw new AppError('Action tidak didefinisikan', 'ROUTING_ERROR', 400);

      const route = DomainRegistry[action];
      if (!route) throw new AppError(`Endpoint '${action}' tidak terdaftar!`, 'NOT_FOUND', 404);

      const service = route.factory();
      const targetMethod = route.method || 'getPaginatedData';
      
      const page = parseInt(params.page) || 1;
      const limit = params.limit ? parseInt(params.limit) : null;

      const data = service[targetMethod](page, limit);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        data: data
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const reqPage = params.page || 'home';
    const templatePath = PageRegistry[reqPage] || 'src/clients/pages/Error404';
    
    const template = HtmlService.createTemplateFromFile('src/clients/components/ui/MainLayout');
    template.activePage = reqPage;
    template.appUrl = ScriptApp.getService().getUrl();
    template.pageContent = templatePath;

    return template.evaluate()
      .setTitle('App Framework')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    const isFetch = e && e.parameter && e.parameter.method === 'fetch';
    if (isFetch) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: error.message
      })).setMimeType(ContentService.MimeType.JSON);
    } else {
      return HtmlService.createHtmlOutput(`<h2>System Error</h2><p>${error.message}</p>`);
    }
  }
}

// 3. Entry Point POST (Mutasi)
function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const payload = contents.data;

    if (!action) throw new AppError('Action tidak didefinisikan', 'ROUTING_ERROR', 400);

    const route = PostRegistry[action];
    if (!route) throw new AppError(`Endpoint '${action}' tidak terdaftar!`, 'NOT_FOUND', 404);

    const context = {
      action: action,
      payload: payload,
      route: route,
      token: contents.token
    };

    const pipeline = new Pipeline([
      LoggingMiddleware.handle,
      RateLimitMiddleware.handle,
      // AuthMiddleware.handle, // Buka komentar ini jika fitur login sudah ada di frontend
      ValidationMiddleware.handle
    ]);

    const finalContext = pipeline.runOrThrow(context);
    const service = route.factory();
    const result = service[route.method](finalContext.payload);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: result
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
      details: error.details || null
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 4. Helper untuk UI HTML
function include(filename) {
  return HtmlService.createTemplateFromFile(filename).evaluate().getContent();
}

// 5. Entry Point Job System
function jobEntryTrigger(e) {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'jobEntryTrigger') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}