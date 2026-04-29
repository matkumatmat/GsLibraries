/**
 * stress_test.js — GsLibraries Framework Full Stress Test Suite
 * ================================================================
 * Entry points (jalankan dari GAS Editor):
 *   runAllTests()       — semua test: unit + integration + stress
 *   runUnitTests()      — core logic saja (cepat, <30 detik)
 *   runStressTests()    — load & bulk ops saja
 *   cleanupTestAssets() — hapus semua sheet/file test yang dibuat
 *
 * Drive Folder Target: 147aYyxZbAW1H1-N5QSFayk4SKab-yBP5
 * ================================================================
 */

// ================================================================
// CONSTANTS
// ================================================================
const STRESS_FOLDER_ID = '147aYyxZbAW1H1-N5QSFayk4SKab-yBP5';
const STRESS_SS_NAME   = 'GsLibraries_StressTest';
const STRESS_PROP_KEY  = 'STRESS_TEST_SS_ID';

// Jumlah baris untuk bulk insert stress test
const STRESS_ROW_COUNT        = 100;
const STRESS_PIPELINE_REPS    = 50;
const STRESS_QUERY_REPS       = 30;
const STRESS_CACHE_REPS       = 40;
const STRESS_EVENTBUS_REPS    = 60;

// ================================================================
// MINI TEST RUNNER
// ================================================================
class T {
  static suite(name) {
    const s = { name, tests: [], passed: 0, failed: 0, ms: 0 };
    this._suites.push(s);
    this._current = s;
    console.log(`\n${'━'.repeat(60)}`);
    console.log(`  ▶ SUITE: ${name}`);
    console.log('━'.repeat(60));
    return this;
  }

  static it(label, fn) {
    const s = this._current;
    const t0 = Date.now();
    try {
      fn(this);
      s.passed++;
      s.tests.push({ ok: true, label, ms: Date.now() - t0 });
      console.log(`    ✅ ${label}`);
    } catch (e) {
      s.failed++;
      s.tests.push({ ok: false, label, err: e.message, ms: Date.now() - t0 });
      console.log(`    ❌ ${label}`);
      console.log(`       ↳ ${e.message}`);
    }
  }

  // Assertion helpers
  static eq(a, b, msg) {
    if (a !== b) throw new Error(msg || `Expected [${b}] got [${a}]`);
  }
  static deepEq(a, b, msg) {
    const as = JSON.stringify(a), bs = JSON.stringify(b);
    if (as !== bs) throw new Error(msg || `Deep eq fail:\n  got: ${as}\n  exp: ${bs}`);
  }
  static ok(v, msg)     { if (!v) throw new Error(msg || `Expected truthy, got ${v}`); }
  static notOk(v, msg)  { if (v)  throw new Error(msg || `Expected falsy, got ${v}`); }
  static isNull(v, msg) { if (v !== null) throw new Error(msg || `Expected null, got ${v}`); }
  static throws(fn, msg) {
    try { fn(); throw new Error('__NO_THROW__'); }
    catch (e) {
      if (e.message === '__NO_THROW__') throw new Error(msg || 'Expected function to throw');
    }
  }
  static notThrows(fn, msg) {
    try { fn(); }
    catch (e) { throw new Error(msg || `Unexpected throw: ${e.message}`); }
  }
  static gt(a, b, msg) { if (a <= b) throw new Error(msg || `Expected ${a} > ${b}`); }
  static lt(a, b, msg) { if (a >= b) throw new Error(msg || `Expected ${a} < ${b}`); }
  static len(arr, n, msg) {
    if (!arr || arr.length !== n) throw new Error(msg || `Expected length ${n}, got ${arr ? arr.length : 'null'}`);
  }
  static contains(str, sub, msg) {
    if (!String(str).includes(sub)) throw new Error(msg || `Expected "${str}" to contain "${sub}"`);
  }
  static instanceOf(obj, Cls, msg) {
    if (!(obj instanceof Cls)) throw new Error(msg || `Expected instance of ${Cls.name}`);
  }

  static printSummary() {
    let totalPass = 0, totalFail = 0, totalMs = 0;
    console.log(`\n${'═'.repeat(60)}`);
    console.log('  SUMMARY');
    console.log('═'.repeat(60));
    this._suites.forEach(s => {
      const ms = s.tests.reduce((a, t) => a + t.ms, 0);
      totalPass += s.passed;
      totalFail += s.failed;
      totalMs   += ms;
      const icon = s.failed === 0 ? '✅' : '❌';
      console.log(`  ${icon} ${s.name.padEnd(38)} ${String(s.passed).padStart(3)} pass  ${String(s.failed).padStart(2)} fail  ${ms}ms`);
    });
    console.log('─'.repeat(60));
    console.log(`  TOTAL: ${totalPass} passed, ${totalFail} failed — ${totalMs}ms`);
    console.log('═'.repeat(60));
    return { totalPass, totalFail, totalMs };
  }

  static reset() { this._suites = []; this._current = null; }
}
T._suites = [];
T._current = null;

// ================================================================
// SETUP HELPERS — buat/dapatkan spreadsheet di folder target
// ================================================================
function _getOrCreateStressSheet() {
  let ssId = PropertiesService.getScriptProperties().getProperty(STRESS_PROP_KEY);

  if (ssId) {
    try {
      SpreadsheetApp.openById(ssId); // cek masih ada
      return ssId;
    } catch (_) {
      ssId = null; // sudah dihapus, buat ulang
    }
  }

  const folder = DriveApp.getFolderById(STRESS_FOLDER_ID);
  const ss     = SpreadsheetApp.create(`${STRESS_SS_NAME}_${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss')}`);
  ssId = ss.getId();

  // Pindahkan ke folder target
  DriveApp.getFileById(ssId).moveTo(folder);

  // Buat semua sheet yang dibutuhkan
  const sheetNames = ['LOG', 'TEST_DATA', 'STRESS_INSERT', 'STRESS_QUERY', 'TEST_REPORT'];
  const existing = ss.getSheets()[0];
  existing.setName(sheetNames[0]);
  sheetNames.slice(1).forEach(n => ss.insertSheet(n));

  // Tulis header masing-masing sheet
  ss.getSheetByName('LOG').appendRow(['id','timestamp','severity','actor','action','message','context','stack']);
  ss.getSheetByName('TEST_DATA').appendRow(['id','name','category','value','status','createdAt','updatedAt']);
  ss.getSheetByName('STRESS_INSERT').appendRow(['id','name','category','value','status','createdAt','updatedAt']);
  ss.getSheetByName('STRESS_QUERY').appendRow(['id','name','category','value','status','createdAt','updatedAt']);
  ss.getSheetByName('TEST_REPORT').appendRow(['suite','test','status','ms','error']);

  PropertiesService.getScriptProperties().setProperty(STRESS_PROP_KEY, ssId);

  // Set ENV properties untuk test
  PropertiesService.getScriptProperties().setProperties({
    APP_ENV:          'dev',
    AUTH_SALT:        'test_salt_gslibraries_2025',
    STRESS_TEST_SS_ID: ssId
  });

  console.log(`Stress test spreadsheet dibuat: https://docs.google.com/spreadsheets/d/${ssId}`);
  return ssId;
}

function _resetSheet(ssId, sheetName) {
  const ss    = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
}

function _writeTestReport(ssId, suiteResults) {
  const ss    = SpreadsheetApp.openById(ssId);
  const sheet = ss.getSheetByName('TEST_REPORT');
  if (!sheet) return;
  suiteResults.forEach(s => {
    s.tests.forEach(t => {
      sheet.appendRow([s.name, t.label, t.ok ? 'PASS' : 'FAIL', t.ms, t.err || '']);
    });
  });
}

// ================================================================
// SECTION 1: Result Monad
// ================================================================
function _testResult() {
  T.suite('Result Monad');

  T.it('ok() membuat Result sukses', t => {
    const r = Result.ok(42);
    t.ok(r.isOk());
    t.notOk(r.isFail());
    t.eq(r.value(), 42);
  });

  T.it('fail() membuat Result gagal', t => {
    const err = new AppError('test error', 'TEST', 400);
    const r   = Result.fail(err);
    t.ok(r.isFail());
    t.notOk(r.isOk());
    t.instanceOf(r.error(), AppError);
  });

  T.it('value() pada Result gagal melempar error', t => {
    const r = Result.fail(new AppError('x'));
    t.throws(() => r.value(), 'Harus throw saat unwrap fail');
  });

  T.it('error() pada Result sukses melempar error', t => {
    const r = Result.ok('data');
    t.throws(() => r.error(), 'Harus throw saat ambil error dari sukses');
  });

  T.it('try() membungkus fungsi sukses', t => {
    const r = Result.try(() => 99);
    t.ok(r.isOk());
    t.eq(r.value(), 99);
  });

  T.it('try() membungkus fungsi throw jadi Result.fail', t => {
    const r = Result.try(() => { throw new Error('boom'); });
    t.ok(r.isFail());
    t.contains(r.error().message, 'boom');
  });

  T.it('try() membungkus throw biasa menjadi AppError', t => {
    const r = Result.try(() => { throw new Error('raw error'); });
    t.instanceOf(r.error(), AppError);
  });

  T.it('map() mentransformasi value sukses', t => {
    const r = Result.ok(5).map(v => v * 2);
    t.eq(r.value(), 10);
  });

  T.it('map() skip transform pada Result gagal', t => {
    const err = new AppError('skip');
    const r   = Result.fail(err).map(v => v * 2);
    t.ok(r.isFail());
  });

  T.it('flatMap() merantai dua Result', t => {
    const r = Result.ok(3)
      .flatMap(v => Result.ok(v + 7));
    t.eq(r.value(), 10);
  });

  T.it('getOrElse() mengembalikan value jika sukses', t => {
    t.eq(Result.ok('hello').getOrElse('default'), 'hello');
  });

  T.it('getOrElse() mengembalikan default jika gagal', t => {
    t.eq(Result.fail(new AppError('x')).getOrElse('default'), 'default');
  });

  T.it('unwrap() melempar error dari Result gagal', t => {
    const err = new AppError('unwrap boom');
    t.throws(() => Result.fail(err).unwrap());
  });
}

// ================================================================
// SECTION 2: AppError Hierarchy
// ================================================================
function _testAppError() {
  T.suite('AppError Hierarchy');

  T.it('AppError dasar memiliki properti lengkap', t => {
    const e = new AppError('msg', 'CODE', 418, { detail: 1 });
    t.eq(e.message, 'msg');
    t.eq(e.code, 'CODE');
    t.eq(e.statusCode, 418);
    t.deepEq(e.details, { detail: 1 });
    t.eq(e.name, 'AppError');
  });

  T.it('AppError instanceof Error', t => {
    t.instanceOf(new AppError('x'), Error);
  });

  const subtypes = [
    ['ValidationError', 422, 'VALIDATION_ERROR'],
    ['AuthError',       401, 'AUTH_ERROR'],
    ['ForbiddenError',  403, 'FORBIDDEN'],
    ['NotFoundError',   404, 'NOT_FOUND'],
    ['ConflictError',   409, 'CONFLICT'],
    ['DatabaseError',   500, 'DATABASE_ERROR']
  ];

  const classMap = {
    ValidationError, AuthError, ForbiddenError,
    NotFoundError, ConflictError, DatabaseError
  };

  subtypes.forEach(([name, status, code]) => {
    T.it(`${name}: statusCode=${status} code=${code}`, t => {
      const e = new classMap[name]('test');
      t.eq(e.statusCode, status);
      t.eq(e.code, code);
      t.instanceOf(e, AppError);
    });
  });

  T.it('ValidationError menyimpan details array', t => {
    const e = new ValidationError('fail', [{ field: 'name', message: 'required' }]);
    t.ok(Array.isArray(e.details));
    t.len(e.details, 1);
  });
}

// ================================================================
// SECTION 3: AppUtils
// ================================================================
function _testAppUtils() {
  T.suite('AppUtils');

  T.it('generateUUID() menghasilkan UUID v4 format', t => {
    const uuid = AppUtils.generateUUID();
    t.ok(uuid, 'UUID tidak kosong');
    t.ok(/^[0-9a-f-]{36}$/.test(uuid), `Format UUID salah: ${uuid}`);
  });

  T.it('generateUUID() selalu unik (1000 iterasi in-memory)', t => {
    const set = new Set();
    for (let i = 0; i < 1000; i++) set.add(AppUtils.generateUUID());
    t.eq(set.size, 1000, 'UUID tidak unik dalam 1000 iterasi');
  });

  T.it('safeParseJson() parse JSON valid', t => {
    const r = AppUtils.safeParseJson('{"a":1}');
    t.deepEq(r, { a: 1 });
  });

  T.it('safeParseJson() fallback ke string jika JSON invalid', t => {
    const r = AppUtils.safeParseJson('bukan json');
    t.eq(r, 'bukan json');
  });

  T.it('safeParseJson() langsung return jika bukan string', t => {
    const obj = { x: 1 };
    t.eq(AppUtils.safeParseJson(obj), obj);
  });

  T.it('safeParseJson() handle array JSON', t => {
    const r = AppUtils.safeParseJson('[1,2,3]');
    t.deepEq(r, [1, 2, 3]);
  });

  T.it('mapArrayToObject() mapping benar', t => {
    const raw  = [['a', 'b'], ['c', 'd']];
    const keys = ['first', 'second'];
    const res  = AppUtils.mapArrayToObject(raw, keys);
    t.eq(res.length, 2);
    t.eq(res[0].first, 'a');
    t.eq(res[1].second, 'd');
  });

  T.it('mapArrayToObject() mengubah empty string menjadi null', t => {
    const r = AppUtils.mapArrayToObject([['', 'x']], ['a', 'b']);
    t.isNull(r[0].a);
    t.eq(r[0].b, 'x');
  });

  T.it('chunkArray() memecah array dengan benar', t => {
    const chunks = AppUtils.chunkArray([1,2,3,4,5], 2);
    t.len(chunks, 3);
    t.deepEq(chunks[0], [1, 2]);
    t.deepEq(chunks[2], [5]);
  });

  T.it('chunkArray() array kosong menghasilkan array kosong', t => {
    t.len(AppUtils.chunkArray([], 10), 0);
  });

  T.it('chunkArray() chunk lebih besar dari array', t => {
    const chunks = AppUtils.chunkArray([1, 2], 100);
    t.len(chunks, 1);
    t.deepEq(chunks[0], [1, 2]);
  });
}

// ================================================================
// SECTION 4: DateUtils
// ================================================================
function _testDateUtils() {
  T.suite('DateUtils');

  T.it('getTimezone() mengembalikan string timezone', t => {
    const tz = DateUtils.getTimezone();
    t.ok(typeof tz === 'string' && tz.length > 0, `Timezone kosong: ${tz}`);
  });

  T.it('format() menghasilkan string tanggal benar', t => {
    const d   = new Date('2025-06-15');
    const str = DateUtils.format(d, 'yyyy-MM-dd');
    t.contains(str, '2025', 'Tahun harus ada');
  });

  T.it('format() null input mengembalikan null', t => {
    t.isNull(DateUtils.format(null));
  });

  T.it('format() menerima string tanggal', t => {
    const str = DateUtils.format('2025-01-01', 'yyyy');
    t.contains(str, '2025');
  });

  T.it('addDays() menambah hari dengan benar', t => {
    const base   = new Date('2025-01-01');
    const result = DateUtils.addDays(base, 5);
    t.eq(result.getDate(), 6);
  });

  T.it('addDays() dengan nilai negatif mengurangi hari', t => {
    const base   = new Date('2025-01-10');
    const result = DateUtils.addDays(base, -3);
    t.eq(result.getDate(), 7);
  });

  T.it('isExpired() benar untuk tanggal lampau', t => {
    t.ok(DateUtils.isExpired('2000-01-01'));
  });

  T.it('isExpired() false untuk tanggal mendatang', t => {
    t.notOk(DateUtils.isExpired('2099-01-01'));
  });

  T.it('isExpired() false untuk input null', t => {
    t.notOk(DateUtils.isExpired(null));
  });

  T.it('getDaysRemaining() positif untuk tanggal mendatang', t => {
    const future = DateUtils.addDays(new Date(), 10);
    t.gt(DateUtils.getDaysRemaining(future), 0);
  });

  T.it('getDaysRemaining() 0 untuk null', t => {
    t.eq(DateUtils.getDaysRemaining(null), 0);
  });
}

// ================================================================
// SECTION 5: Validator
// ================================================================
function _testValidator() {
  T.suite('Validator');

  const schema = {
    name:     { required: true, type: 'string', minLength: 2, maxLength: 50 },
    age:      { required: true, type: 'number' },
    role:     { required: false, type: 'string', enum: ['ADMIN','USER','GUEST'], default: 'USER' },
    tags:     { required: false, type: 'array' }
  };

  T.it('validate() sukses dengan data valid', t => {
    t.notThrows(() => Validator.validate({ name: 'Kaayeey', age: 25, role: 'ADMIN' }, schema));
  });

  T.it('validate() melempar ValidationError jika required kosong', t => {
    t.throws(() => Validator.validate({ age: 25 }, schema));
  });

  T.it('validate() melempar jika tipe number salah', t => {
    t.throws(() => Validator.validate({ name: 'X', age: 'bukan angka' }, schema));
  });

  T.it('validate() melempar jika enum tidak valid', t => {
    t.throws(() => Validator.validate({ name: 'Y', age: 20, role: 'SUPERUSER' }, schema));
  });

  T.it('validate() melempar jika minLength dilanggar', t => {
    t.throws(() => Validator.validate({ name: 'A', age: 20 }, schema));
  });

  T.it('validate() melempar jika maxLength dilanggar', t => {
    const longName = 'A'.repeat(51);
    t.throws(() => Validator.validate({ name: longName, age: 20 }, schema));
  });

  T.it('validate() melempar jika tipe array salah', t => {
    t.throws(() => Validator.validate({ name: 'OK', age: 20, tags: 'bukan array' }, schema));
  });

  T.it('validateSafe() mengembalikan Result.ok pada data valid', t => {
    const r = Validator.validateSafe({ name: 'Kaayeey', age: 25 }, schema);
    t.ok(r.isOk());
  });

  T.it('validateSafe() mengembalikan Result.fail pada data invalid', t => {
    const r = Validator.validateSafe({}, schema);
    t.ok(r.isFail());
    t.instanceOf(r.error(), ValidationError);
  });

  T.it('sanitize() membuang field asing', t => {
    const data = { name: 'K', age: 20, role: 'USER', secret: 'expose' };
    const s    = Validator.sanitize(data, schema);
    t.ok(s.name === 'K');
    t.notOk('secret' in s, 'Field asing harus dibuang');
  });

  T.it('sanitize() menerapkan default value', t => {
    const data = { name: 'K', age: 20 };
    const s    = Validator.sanitize(data, schema);
    t.eq(s.role, 'USER');
  });

  T.it('ValidationError detail berisi semua field yang gagal', t => {
    try {
      Validator.validate({}, schema);
    } catch (e) {
      t.instanceOf(e, ValidationError);
      t.ok(Array.isArray(e.details));
      t.gt(e.details.length, 0);
    }
  });
}

// ================================================================
// SECTION 6: Pipeline
// ================================================================
function _testPipeline() {
  T.suite('Pipeline');

  // Helper middleware factories
  const makeAppender = label => ({
    handle: ctx => { ctx.log = (ctx.log || '') + label; }
  });
  const makeRejecter = msg => ({
    handle: ctx => { ctx.isRejected = true; ctx.error = new AppError(msg); }
  });

  T.it('run() mengeksekusi semua middleware berurutan', t => {
    const p   = new Pipeline([makeAppender('A'), makeAppender('B'), makeAppender('C')]);
    const ctx = { log: '', isRejected: false };
    p.run(ctx);
    t.eq(ctx.log, 'ABC');
  });

  T.it('run() berhenti pada middleware yang men-reject context', t => {
    const p = new Pipeline([
      makeAppender('A'),
      makeRejecter('stop here'),
      makeAppender('B')
    ]);
    const ctx = { log: '', isRejected: false };
    p.run(ctx);
    t.eq(ctx.log, 'A', 'B tidak boleh dieksekusi setelah reject');
    t.ok(ctx.isRejected);
  });

  T.it('use() menambah middleware dan chainable', t => {
    const p = new Pipeline();
    const r = p.use(makeAppender('X')).use(makeAppender('Y'));
    t.eq(r, p, 'use() harus return Pipeline itu sendiri');
    const ctx = { log: '', isRejected: false };
    p.run(ctx);
    t.eq(ctx.log, 'XY');
  });

  T.it('runOrThrow() berhasil mengembalikan context jika tidak ada reject', t => {
    const p   = new Pipeline([makeAppender('OK')]);
    const ctx = { log: '', isRejected: false };
    const r   = p.runOrThrow(ctx);
    t.eq(r.log, 'OK');
  });

  T.it('runOrThrow() melempar error AppError saat context di-reject', t => {
    const p   = new Pipeline([makeRejecter('forbidden')]);
    const ctx = { isRejected: false };
    t.throws(() => p.runOrThrow(ctx));
  });

  T.it('Pipeline dengan 0 middleware tidak throw', t => {
    const p   = new Pipeline([]);
    const ctx = { isRejected: false };
    t.notThrows(() => p.run(ctx));
  });

  T.it('middleware dapat memodifikasi context dan diakses oleh middleware berikutnya', t => {
    const p = new Pipeline([
      { handle: ctx => { ctx.x = 10; } },
      { handle: ctx => { ctx.y = ctx.x * 2; } }
    ]);
    const ctx = { isRejected: false };
    p.run(ctx);
    t.eq(ctx.y, 20);
  });
}

// ================================================================
// SECTION 7: Container (Dependency Injection)
// ================================================================
function _testContainer() {
  T.suite('Container (DI)');

  T.it('bind + make singleton mengembalikan instance yang sama', t => {
    Container.bind('_TestServiceSingleton', () => ({ id: Math.random() }), true);
    const a = Container.make('_TestServiceSingleton');
    const b = Container.make('_TestServiceSingleton');
    t.eq(a.id, b.id, 'Singleton harus return instance sama');
  });

  T.it('bind + make transient selalu buat instance baru', t => {
    Container.bind('_TestServiceTransient', () => ({ id: Math.random() }), false);
    const a = Container.make('_TestServiceTransient');
    const b = Container.make('_TestServiceTransient');
    t.ok(a.id !== b.id, 'Transient harus buat instance berbeda');
  });

  T.it('make() melempar AppError untuk key tidak terdaftar', t => {
    t.throws(() => Container.make('__KEY_TIDAK_ADA__'));
  });

  T.it('clear() menghapus singleton cache sehingga instance baru dibuat', t => {
    let counter = 0;
    Container.bind('_TestCounter', () => ({ n: ++counter }), true);
    Container.make('_TestCounter');
    Container.clear();
    const after = Container.make('_TestCounter');
    t.eq(after.n, 2, 'Setelah clear(), factory harus dipanggil lagi');
  });

  T.it('factory yang melempar error tidak menyimpan instance di cache', t => {
    let calls = 0;
    Container.bind('_TestFailing', () => {
      calls++;
      if (calls === 1) throw new AppError('factory fail');
      return { ok: true };
    }, true);

    try { Container.make('_TestFailing'); } catch (_) {}
    const r = Container.make('_TestFailing');
    t.ok(r.ok);
  });
}

// ================================================================
// SECTION 8: EventBus
// ================================================================
function _testEventBus() {
  T.suite('EventBus');

  // Reset listeners sebelum test agar tidak bocor antar test
  function resetBus() {
    EventBus._listeners = {};
  }

  T.it('on() + emit() memanggil listener dengan payload benar', t => {
    resetBus();
    let received = null;
    const L = { handle: p => { received = p; } };
    EventBus.on('test.evt', L);
    EventBus.emit('test.evt', { value: 42 });
    t.deepEq(received, { value: 42 });
  });

  T.it('emit() memanggil semua listener terdaftar', t => {
    resetBus();
    const results = [];
    EventBus.on('multi.evt', { handle: _ => results.push(1) });
    EventBus.on('multi.evt', { handle: _ => results.push(2) });
    EventBus.on('multi.evt', { handle: _ => results.push(3) });
    EventBus.emit('multi.evt', {});
    t.deepEq(results, [1, 2, 3]);
  });

  T.it('emit() pada event tidak terdaftar tidak throw', t => {
    resetBus();
    t.notThrows(() => EventBus.emit('tidak.ada.event', {}));
  });

  T.it('emit() melempar error jika listener throw', t => {
    resetBus();
    EventBus.on('throwing.evt', { handle: _ => { throw new Error('listener crash'); } });
    t.throws(() => EventBus.emit('throwing.evt', {}));
  });

  T.it('emitSafe() menelan error dari listener yang crash', t => {
    resetBus();
    let sideEffectDone = false;
    EventBus.on('safe.evt', { handle: _ => { throw new Error('crash'); } });
    EventBus.on('safe.evt', { handle: _ => { sideEffectDone = true; } });
    t.notThrows(() => EventBus.emitSafe('safe.evt', {}));
    t.ok(sideEffectDone, 'Listener ke-2 harus tetap jalan walau listener ke-1 crash');
  });

  T.it('on() pada event yang sama terus menambah (tidak overwrite)', t => {
    resetBus();
    let count = 0;
    EventBus.on('count.evt', { handle: _ => count++ });
    EventBus.on('count.evt', { handle: _ => count++ });
    EventBus.emit('count.evt', {});
    t.eq(count, 2);
  });
}

// ================================================================
// SECTION 9: CacheDriver & CacheManager (live GAS Cache)
// ================================================================
function _testCache() {
  T.suite('CacheDriver & CacheManager');

  T.it('CacheDriver.set() + get() untuk value kecil', t => {
    CacheDriver.set('_TEST_KEY_SMALL', { hello: 'world' }, 60);
    const r = CacheDriver.get('_TEST_KEY_SMALL');
    t.deepEq(r, { hello: 'world' });
  });

  T.it('CacheDriver.delete() menghapus key', t => {
    CacheDriver.set('_TEST_KEY_DEL', 'akan_dihapus', 60);
    CacheDriver.delete('_TEST_KEY_DEL');
    const r = CacheDriver.get('_TEST_KEY_DEL');
    t.isNull(r);
  });

  T.it('CacheDriver.get() pada key tidak ada mengembalikan null', t => {
    const r = CacheDriver.get('_KEY_TIDAK_PERNAH_ADA_' + Date.now());
    t.isNull(r);
  });

  T.it('CacheDriver menangani objek besar (chunking)', t => {
    // Buat payload ~120KB
    const big = { data: 'x'.repeat(120000) };
    t.notThrows(() => CacheDriver.set('_TEST_BIG', big, 60));
    const r = CacheDriver.get('_TEST_BIG');
    t.ok(r && r.data.length === 120000, 'Data besar harus bisa di-reconstruct');
    CacheDriver.delete('_TEST_BIG');
  });

  T.it('CacheManager.set() + get() menggunakan prefix versioned key', t => {
    CacheManager.set('TEST_GROUP', 'item1', 'nilai_tes', 60);
    const v = CacheManager.get('TEST_GROUP', 'item1');
    t.eq(v, 'nilai_tes');
  });

  T.it('CacheManager.invalidate() membuat cache lama tidak terbaca', t => {
    CacheManager.set('INVAL_GROUP', 'item', 'sebelum', 60);
    CacheManager.invalidate('INVAL_GROUP');
    const v = CacheManager.get('INVAL_GROUP', 'item');
    t.isNull(v, 'Setelah invalidate, cache lama harus null');
  });

  T.it('CacheStrategy.getTtlForGroup() mengembalikan TTL sesuai group', t => {
    t.eq(CacheStrategy.getTtlForGroup('AUTH_SESSIONS'), CacheStrategy.MAX);
    t.eq(CacheStrategy.getTtlForGroup('MASTER_DATA'),  CacheStrategy.LONG);
    t.eq(CacheStrategy.getTtlForGroup('RATE_LIMITS'),  CacheStrategy.VERY_SHORT);
    t.gt(CacheStrategy.MAX, CacheStrategy.LONG);
    t.gt(CacheStrategy.LONG, CacheStrategy.MEDIUM);
    t.gt(CacheStrategy.MEDIUM, CacheStrategy.SHORT);
  });
}

// ================================================================
// SECTION 10: Logger + LogRepository (live sheet)
// ================================================================
function _testLogger(ssId) {
  T.suite('Logger & LogRepository');

  T.it('Logger tanpa repo tidak throw (silent mode)', t => {
    Logger.setRepository(null);
    t.notThrows(() => Logger.info('pesan tanpa repo'));
    t.notThrows(() => Logger.error('error tanpa repo', {}, new Error('dummy')));
  });

  T.it('Logger dengan repo menulis ke sheet', t => {
    const driver  = new SheetDriver(ssId, 'LOG');
    const gate    = WriteGate;
    const repo    = new LogRepository(driver, gate);
    Logger.setRepository(repo);

    const beforeRows = SpreadsheetApp.openById(ssId).getSheetByName('LOG').getLastRow();
    Logger.info('INFO log test', { module: 'stress_test' });
    Logger.warn('WARN log test', { warning: true });
    Logger.debug('DEBUG log test', {});
    Logger.error('ERROR log test', {}, new Error('test error object'));
    Logger.audit('test_actor', 'TEST_ACTION', 'TestEntity', 'id-123', { before: 1 }, { after: 2 });

    const afterRows = SpreadsheetApp.openById(ssId).getSheetByName('LOG').getLastRow();
    t.gt(afterRows, beforeRows, 'Baris log harus bertambah');
  });

  T.it('Logger.debug() hanya tulis saat APP_ENV=dev', t => {
    const driver = new SheetDriver(ssId, 'LOG');
    Logger.setRepository(new LogRepository(driver, WriteGate));
    const before = SpreadsheetApp.openById(ssId).getSheetByName('LOG').getLastRow();
    Logger.debug('debug message - seharusnya masuk', {});
    const after = SpreadsheetApp.openById(ssId).getSheetByName('LOG').getLastRow();
    t.gt(after, before, 'Debug harus masuk karena APP_ENV=dev');
  });

  T.it('LogRepository.write() tidak throw jika driver null', t => {
    const repo = new LogRepository(null, WriteGate);
    t.notThrows(() => repo.write({ id: 'x', timestamp: new Date(), severity: 'INFO', actor: 'SYSTEM', action: 'TEST', message: 'ok', context: {}, stack: '-' }));
  });
}

// ================================================================
// SECTION 11: SheetDriver — CRUD Live
// ================================================================
function _testSheetDriver(ssId) {
  T.suite('SheetDriver (Live CRUD)');

  const SHEET = 'TEST_DATA';
  const KEYS  = ['id', 'name', 'category', 'value', 'status', 'createdAt', 'updatedAt'];

  T.it('SheetDriver konstruktor melempar jika ssId kosong', t => {
    t.throws(() => new SheetDriver('', 'SHEET'));
  });

  T.it('SheetDriver konstruktor melempar jika sheetName kosong', t => {
    t.throws(() => new SheetDriver(ssId, ''));
  });

  T.it('append() menyisipkan baris baru dan readRaw() membacanya', t => {
    _resetSheet(ssId, SHEET);
    const driver = new SheetDriver(ssId, SHEET);
    const now    = new Date().toISOString();
    const id     = Utilities.getUuid();
    driver.append([id, 'Test Item', 'catA', 100, 'ACTIVE', now, now]);
    const rows = driver.readRaw();
    t.eq(rows.length, 1);
    t.eq(rows[0][0], id);
    t.eq(rows[0][1], 'Test Item');
  });

  T.it('readRaw() mengembalikan [] untuk sheet kosong', t => {
    _resetSheet(ssId, SHEET);
    const driver = new SheetDriver(ssId, SHEET);
    t.deepEq(driver.readRaw(), []);
  });

  T.it('updateRow() mengubah isi baris yang ditarget', t => {
    _resetSheet(ssId, SHEET);
    const driver = new SheetDriver(ssId, SHEET);
    const now    = new Date().toISOString();
    const id     = Utilities.getUuid();
    driver.append([id, 'Before Update', 'catA', 50, 'ACTIVE', now, now]);
    driver.updateRow(2, [id, 'After Update', 'catB', 99, 'INACTIVE', now, now]);
    const rows = driver.readRaw();
    t.eq(rows[0][1], 'After Update');
    t.eq(rows[0][4], 'INACTIVE');
  });

  T.it('readPage() mengembalikan baris sesuai pagination', t => {
    _resetSheet(ssId, SHEET);
    const driver = new SheetDriver(ssId, SHEET);
    const now    = new Date().toISOString();
    // Insert 10 baris
    for (let i = 1; i <= 10; i++) {
      driver.append([Utilities.getUuid(), `Item ${i}`, 'catA', i * 10, 'ACTIVE', now, now]);
    }
    const page1 = driver.readPage(1, 4);
    const page2 = driver.readPage(2, 4);
    const page3 = driver.readPage(3, 4);
    t.len(page1, 4);
    t.len(page2, 4);
    t.len(page3, 2);
  });

  T.it('readPage() pada sheet kosong mengembalikan []', t => {
    _resetSheet(ssId, SHEET);
    const driver = new SheetDriver(ssId, SHEET);
    t.deepEq(driver.readPage(1, 10), []);
  });
}

// ================================================================
// SECTION 12: QueryBuilder
// ================================================================
function _testQueryBuilder(ssId) {
  T.suite('QueryBuilder (Filtering & Sorting)');

  const SHEET = 'TEST_DATA';
  const KEYS  = ['id', 'name', 'category', 'value', 'status', 'createdAt', 'updatedAt'];

  function seedData() {
    _resetSheet(ssId, SHEET);
    const driver = new SheetDriver(ssId, SHEET);
    const now    = new Date().toISOString();
    const rows   = [
      ['id-1', 'Alpha',   'catA', 100, 'ACTIVE',   now, now],
      ['id-2', 'Beta',    'catB', 200, 'ACTIVE',   now, now],
      ['id-3', 'Gamma',   'catA', 150, 'INACTIVE', now, now],
      ['id-4', 'Delta',   'catC', 300, 'ACTIVE',   now, now],
      ['id-5', 'Epsilon', 'catB', 250, 'DELETED',  now, now],
      ['id-6', 'Zeta',    'catA', 50,  'ACTIVE',   now, now]
    ];
    rows.forEach(r => driver.append(r));
    return new SheetDriver(ssId, SHEET);
  }

  T.it('get() tanpa filter mengembalikan semua baris', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).get();
    t.len(r, 6);
  });

  T.it('where("=") memfilter nilai tepat', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).where('status', '=', 'ACTIVE').get();
    t.eq(r.length, 4);
    r.forEach(item => t.eq(item.status, 'ACTIVE'));
  });

  T.it('where("!=") memfilter nilai yang tidak sama', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).where('status', '!=', 'ACTIVE').get();
    t.eq(r.length, 2);
  });

  T.it('where(">") memfilter nilai numerik', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).where('value', '>', 200).get();
    t.eq(r.length, 2);
  });

  T.it('where("<=") memfilter nilai numerik', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).where('value', '<=', 150).get();
    t.eq(r.length, 3);
  });

  T.it('whereIn() memfilter array nilai', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).whereIn('category', ['catA', 'catC']).get();
    t.eq(r.length, 4);
  });

  T.it('whereLike() memfilter substring case-insensitive', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).whereLike('name', 'ta').get(); // Beta, Delta, Zeta
    t.eq(r.length, 3);
  });

  T.it('whereRaw() custom filter function', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).whereRaw(item => item.value >= 200 && item.status === 'ACTIVE').get();
    t.eq(r.length, 2);
  });

  T.it('orderBy() ascending', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).orderBy('value', 'asc').get();
    t.eq(r[0].value, 50);
    t.eq(r[r.length - 1].value, 300);
  });

  T.it('orderBy() descending', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).orderBy('value', 'desc').get();
    t.eq(r[0].value, 300);
    t.eq(r[r.length - 1].value, 50);
  });

  T.it('limit() membatasi jumlah hasil', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS).limit(3).get();
    t.len(r, 3);
  });

  T.it('offset() melewati baris pertama', t => {
    const driver = seedData();
    const all    = new QueryBuilder(driver, KEYS).get();
    const paged  = new QueryBuilder(driver, KEYS).offset(2).get();
    t.eq(paged.length, all.length - 2);
  });

  T.it('limit + offset = pagination manual', t => {
    const driver = seedData();
    const page2  = new QueryBuilder(driver, KEYS).limit(2).offset(2).get();
    t.len(page2, 2);
  });

  T.it('first() mengembalikan item pertama saja', t => {
    const driver = seedData();
    const item   = new QueryBuilder(driver, KEYS).orderBy('value', 'asc').first();
    t.ok(item !== null);
    t.eq(item.value, 50);
  });

  T.it('first() mengembalikan null jika tidak ada hasil', t => {
    const driver = seedData();
    const item   = new QueryBuilder(driver, KEYS).where('status', '=', 'NONEXISTENT').first();
    t.isNull(item);
  });

  T.it('_rowNumber tersedia di setiap item untuk update', t => {
    const driver = seedData();
    const r      = new QueryBuilder(driver, KEYS).get();
    r.forEach((item, i) => t.eq(item._rowNumber, i + 2));
  });

  T.it('chaining: where + orderBy + limit', t => {
    const driver = seedData();
    const r = new QueryBuilder(driver, KEYS)
      .where('status', '=', 'ACTIVE')
      .orderBy('value', 'desc')
      .limit(2)
      .get();
    t.len(r, 2);
    t.gt(r[0].value, r[1].value);
  });
}

// ================================================================
// SECTION 13: BaseRepo (CRUD via live sheet)
// ================================================================
function _testBaseRepo(ssId) {
  T.suite('BaseRepo (CRUD Abstraction)');

  const SHEET = 'TEST_DATA';
  const KEYS  = ['id', 'name', 'category', 'value', 'status', 'createdAt', 'updatedAt'];

  function makeRepo() {
    _resetSheet(ssId, SHEET);
    const driver = new SheetDriver(ssId, SHEET);
    return new BaseRepo(driver, KEYS, 2);
  }

  T.it('create() menyisipkan entity dan mengembalikan data dengan id', t => {
    const repo   = makeRepo();
    const entity = repo.create({ name: 'Repo Test', category: 'catA', value: 77, status: 'ACTIVE' });
    t.ok(entity.id, 'id harus ter-generate');
    t.ok(entity.createdAt, 'createdAt harus ada');
    t.ok(entity.updatedAt, 'updatedAt harus ada');
  });

  T.it('findById() menemukan entity yang baru dibuat', t => {
    const repo   = makeRepo();
    const entity = repo.create({ name: 'Find Me', category: 'catB', value: 88, status: 'ACTIVE' });
    const found  = repo.findById(entity.id);
    t.ok(found !== null, 'Entity harus ditemukan');
    t.eq(found.name, 'Find Me');
  });

  T.it('findById() mengembalikan null untuk ID tidak ada', t => {
    const repo = makeRepo();
    t.isNull(repo.findById('id-tidak-ada-sama-sekali'));
  });

  T.it('all() mengembalikan semua entity', t => {
    const repo = makeRepo();
    repo.create({ name: 'A', category: 'c', value: 1, status: 'ACTIVE' });
    repo.create({ name: 'B', category: 'c', value: 2, status: 'ACTIVE' });
    repo.create({ name: 'C', category: 'c', value: 3, status: 'ACTIVE' });
    const all = repo.all();
    t.eq(all.length, 3);
  });

  T.it('exists() mengembalikan true untuk ID yang ada', t => {
    const repo   = makeRepo();
    const entity = repo.create({ name: 'Exists Test', category: 'c', value: 1, status: 'ACTIVE' });
    t.ok(repo.exists(entity.id));
  });

  T.it('exists() mengembalikan false untuk ID tidak ada', t => {
    const repo = makeRepo();
    t.notOk(repo.exists('phantom-id-999'));
  });

  T.it('update() mengubah field yang ditentukan', t => {
    const repo    = makeRepo();
    const entity  = repo.create({ name: 'Before', category: 'c', value: 1, status: 'ACTIVE' });
    const updated = repo.update(entity.id, { name: 'After', value: 999 });
    t.eq(updated.name, 'After');
    t.eq(updated.value, 999);
    t.eq(updated.category, 'c', 'category tidak boleh berubah');
  });

  T.it('update() melempar NotFoundError untuk ID tidak ada', t => {
    const repo = makeRepo();
    t.throws(() => repo.update('NONEXISTENT', { name: 'X' }));
  });

  T.it('softDelete() mengubah status menjadi DELETED', t => {
    const repo   = makeRepo();
    const entity = repo.create({ name: 'Will Die', category: 'c', value: 1, status: 'ACTIVE' });
    repo.softDelete(entity.id);
    const found = repo.findById(entity.id);
    t.eq(found.status, 'DELETED');
    t.ok(found.deletedAt, 'deletedAt harus ter-set');
  });
}

// ================================================================
// SECTION 14: DriveManager
// ================================================================
function _testDriveManager() {
  T.suite('DriveManager');

  T.it('getFolder() berhasil mendapatkan folder dari ID yang valid', t => {
    const folder = DriveManager.getFolder(STRESS_FOLDER_ID);
    t.ok(folder, 'Folder harus ada');
    t.ok(folder.getId() === STRESS_FOLDER_ID, 'ID folder harus sama');
  });

  T.it('getFolder() fallback ke root jika folderId null', t => {
    const folder = DriveManager.getFolder(null);
    t.ok(folder, 'Harus return root folder');
    t.ok(typeof folder.getName === 'function');
  });

  T.it('getFolder() melempar AppError untuk ID yang tidak valid', t => {
    t.throws(() => DriveManager.getFolder('ID_FOLDER_TIDAK_VALID_SAMA_SEKALI'));
  });

  T.it('getThumbnailUrl() menghasilkan URL format benar', t => {
    const url = DriveManager.getThumbnailUrl('test-file-id-123', 'w400');
    t.contains(url, 'test-file-id-123');
    t.contains(url, 'w400');
    t.contains(url, 'drive.google.com/thumbnail');
  });

  T.it('uploadBase64() mengupload file ke folder target', t => {
    const base64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
    const result = DriveManager.uploadBase64(base64, `stress_test_upload_${Date.now()}.png`, STRESS_FOLDER_ID);
    t.ok(result.id, 'File ID harus ada');
    t.ok(result.url, 'URL harus ada');
    t.ok(result.downloadUrl, 'Download URL harus ada');
    // Cleanup
    try { DriveApp.getFileById(result.id).setTrashed(true); } catch (_) {}
  });

  T.it('uploadBase64() tanpa header data URI juga bekerja', t => {
    const raw = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
    t.notThrows(() => {
      const r = DriveManager.uploadBase64(raw, `raw_upload_${Date.now()}.png`, STRESS_FOLDER_ID);
      try { DriveApp.getFileById(r.id).setTrashed(true); } catch (_) {}
    });
  });
}

// ================================================================
// SECTION 15: AuthService
// ================================================================
function _testAuthService() {
  T.suite('AuthService');

  T.it('hashPassword() mengembalikan hex string 64 karakter (SHA-256)', t => {
    const hash = AuthService.hashPassword('password123');
    t.ok(typeof hash === 'string', 'Harus string');
    t.eq(hash.length, 64, 'SHA-256 hex harus 64 char');
    t.ok(/^[0-9a-f]+$/.test(hash), 'Harus hex lowercase');
  });

  T.it('hashPassword() deterministik (input sama = output sama)', t => {
    const h1 = AuthService.hashPassword('secret');
    const h2 = AuthService.hashPassword('secret');
    t.eq(h1, h2);
  });

  T.it('hashPassword() berbeda untuk input berbeda', t => {
    const h1 = AuthService.hashPassword('passA');
    const h2 = AuthService.hashPassword('passB');
    t.ok(h1 !== h2);
  });

  T.it('createSession() mengembalikan token UUID valid', t => {
    const token = AuthService.createSession({ email: 'test@test.com', role: 'ADMIN' });
    t.ok(token, 'Token tidak boleh kosong');
    t.ok(/^[0-9a-f-]{36}$/.test(token), `Token bukan UUID: ${token}`);
  });

  T.it('validateToken() mengembalikan user data yang benar', t => {
    const user  = { email: 'user@test.com', role: 'USER', name: 'Test User' };
    const token = AuthService.createSession(user);
    const found = AuthService.validateToken(token);
    t.ok(found !== null, 'Token harus valid');
    t.eq(found.email, user.email);
    t.eq(found.role, user.role);
  });

  T.it('validateToken() mengembalikan null untuk token tidak valid', t => {
    const r = AuthService.validateToken('token-palsu-tidak-ada');
    t.isNull(r);
  });

  T.it('validateToken() mengembalikan null untuk null/undefined', t => {
    t.isNull(AuthService.validateToken(null));
    t.isNull(AuthService.validateToken(undefined));
  });

  T.it('destroySession() menghapus sesi dari cache', t => {
    const user  = { email: 'del@test.com', role: 'GUEST' };
    const token = AuthService.createSession(user);
    AuthService.destroySession(token);
    t.isNull(AuthService.validateToken(token), 'Session harus sudah terhapus');
  });
}

// ================================================================
// SECTION 16: Middleware (simulasi context)
// ================================================================
function _testMiddleware() {
  T.suite('Middleware Stack');

  // LoggingMiddleware
  T.it('LoggingMiddleware.handle() menyisipkan startTime ke context.meta', t => {
    const ctx = { action: 'createOrder', user: { name: 'K' }, isRejected: false };
    Logger.setRepository(null); // silent
    LoggingMiddleware.handle(ctx);
    t.ok(ctx.meta && ctx.meta.startTime > 0, 'startTime harus ada');
  });

  T.it('LoggingMiddleware.handle() tetap berjalan untuk GUEST (tanpa user)', t => {
    const ctx = { action: 'doSomething', isRejected: false };
    Logger.setRepository(null);
    t.notThrows(() => LoggingMiddleware.handle(ctx));
    t.ok(ctx.meta.startTime > 0);
  });

  // ValidationMiddleware
  T.it('ValidationMiddleware.handle() melewatkan jika tidak ada schema', t => {
    const ctx = { route: {}, payload: { x: 1 }, isRejected: false };
    t.notThrows(() => ValidationMiddleware.handle(ctx));
  });

  T.it('ValidationMiddleware.handle() menjalankan Validator jika ada schema', t => {
    const ctx = {
      route: {
        schema: { nama: { required: true, type: 'string' } }
      },
      payload: { nama: 'Kaayeey' },
      isRejected: false
    };
    t.notThrows(() => ValidationMiddleware.handle(ctx));
  });

  T.it('ValidationMiddleware.handle() melempar ValidationError pada payload invalid', t => {
    const ctx = {
      route: { schema: { nama: { required: true, type: 'string' } } },
      payload: {},
      isRejected: false
    };
    t.throws(() => ValidationMiddleware.handle(ctx));
  });

  // AuthMiddleware
  T.it('AuthMiddleware melempar AuthError jika tidak ada token', t => {
    Container.bind('AuthService', () => AuthService, false);
    const ctx = { token: null, isRejected: false };
    t.throws(() => AuthMiddleware.handle(ctx));
  });

  T.it('AuthMiddleware meng-inject user ke context jika token valid', t => {
    Container.bind('AuthService', () => AuthService, false);
    const user  = { email: 'mw@test.com', role: 'ADMIN', name: 'MWUser' };
    const token = AuthService.createSession(user);
    const ctx   = { token, isRejected: false };
    t.notThrows(() => AuthMiddleware.handle(ctx));
    t.ok(ctx.user && ctx.user.email === user.email, 'User harus di-inject ke context');
  });

  T.it('AuthMiddleware melempar AuthError untuk token expired/invalid', t => {
    Container.bind('AuthService', () => AuthService, false);
    const ctx = { token: 'expired-atau-tidak-ada', isRejected: false };
    t.throws(() => AuthMiddleware.handle(ctx));
  });

  // RateLimitMiddleware — reset cache sebelum test
  T.it('RateLimitMiddleware tidak throw untuk request pertama', t => {
    const identifier = `stress_test_rl_${Date.now()}`;
    CacheManager.delete('RATE_LIMITS', identifier);
    const ctx = { user: { email: identifier }, isRejected: false };
    t.notThrows(() => RateLimitMiddleware.handle(ctx));
  });

  T.it('RateLimitMiddleware melempar 429 setelah melampaui MAX_REQUESTS', t => {
    const identifier = `stress_rl_overflow_${Date.now()}`;
    CacheManager.set('RATE_LIMITS', identifier, String(RateLimitMiddleware.MAX_REQUESTS), 60);
    const ctx = { user: { email: identifier }, isRejected: false };
    t.throws(() => RateLimitMiddleware.handle(ctx));
  });

  // Pipeline + Middleware E2E
  T.it('Pipeline dengan LoggingMiddleware + ValidationMiddleware berjalan normal', t => {
    Logger.setRepository(null);
    const schema = { action: { required: true, type: 'string' } };
    const ctxRoute = { schema };
    const ctx = {
      route:      ctxRoute,
      action:     'createItem',
      payload:    { action: 'createItem' },
      isRejected: false
    };
    const p = new Pipeline([LoggingMiddleware, ValidationMiddleware]);
    t.notThrows(() => p.run(ctx));
    t.ok(ctx.meta.startTime > 0);
  });
}

// ================================================================
// SECTION 17: JobRunner (dengan mock Job)
// ================================================================
function _testJobRunner() {
  T.suite('JobRunner (Mock Job)');

  // Mock Job sederhana
  const processed = [];
  const MockJob = {
    get jobName() { return 'STRESS_MOCK_JOB'; },
    getData: (state) => ['item1', 'item2', 'item3', 'item4', 'item5'],
    handle: (item, state) => { processed.push(item); },
    onComplete: (state) => { /* no-op */ }
  };

  T.it('JobRunner.execute() memproses semua item pada MockJob', t => {
    processed.length = 0;
    PropertiesService.getScriptProperties().deleteProperty('JOB_STATE_STRESS_MOCK_JOB');
    Logger.setRepository(null);

    const r = JobRunner.execute(MockJob);
    t.ok(r.isOk(), `JobRunner harus sukses: ${r.isOk() ? '' : r.error().message}`);
    t.eq(processed.length, 5, `Harus proses 5 item, tapi proses: ${processed.length}`);
  });

  T.it('JobRunner._saveState() + _loadState() roundtrip', t => {
    const state    = { currentIndex: 3, totalProcessed: 3, extra: 'data' };
    const jobName  = 'STRESS_STATE_ROUNDTRIP';
    JobRunner._saveState(jobName, state);
    const loaded = JobRunner._loadState(jobName);
    t.deepEq(loaded, state);
    JobRunner._clearState(jobName);
    t.isNull(JobRunner._loadState(jobName));
  });

  T.it('JobRunner.execute() memanggil onComplete setelah semua diproses', t => {
    let completeCalled = false;
    const CompletionJob = {
      get jobName() { return 'COMPLETION_TEST_JOB'; },
      getData: () => [1, 2],
      handle: () => {},
      onComplete: (state) => { completeCalled = true; }
    };
    PropertiesService.getScriptProperties().deleteProperty('JOB_STATE_COMPLETION_TEST_JOB');
    Logger.setRepository(null);
    JobRunner.execute(CompletionJob);
    t.ok(completeCalled, 'onComplete harus dipanggil setelah proses selesai');
  });

  T.it('JobRunner.execute() data kosong langsung panggil onComplete', t => {
    let completeCalled = false;
    const EmptyJob = {
      get jobName() { return 'EMPTY_JOB'; },
      getData: () => [],
      handle: () => {},
      onComplete: () => { completeCalled = true; }
    };
    PropertiesService.getScriptProperties().deleteProperty('JOB_STATE_EMPTY_JOB');
    Logger.setRepository(null);
    const r = JobRunner.execute(EmptyJob);
    t.ok(r.isOk());
    t.ok(completeCalled);
  });
}

// ================================================================
// SECTION 18: BaseService (filter, paginate, parseJson)
// ================================================================
function _testBaseService(ssId) {
  T.suite('BaseService (Data Processing)');

  const SHEET = 'TEST_DATA';
  const KEYS  = ['id', 'name', 'category', 'value', 'status', 'createdAt', 'updatedAt'];

  function makeService() {
    _resetSheet(ssId, SHEET);
    const driver = new SheetDriver(ssId, SHEET);
    const repo   = new BaseRepo(driver, KEYS, 2);
    return new BaseService(repo);
  }

  const sampleItems = [
    { id: '1', name: 'A', status: 'ACTIVE',   value: 10 },
    { id: '2', name: 'B', status: 'INACTIVE', value: 20 },
    { id: '3', name: 'C', status: 'ACTIVE',   value: 30 },
    { id: '4', name: 'D', status: 'DELETED',  value: 40 }
  ];

  T.it('_filter() tanpa config mengembalikan semua item', t => {
    const svc = makeService();
    const r   = svc._filter(sampleItems, null);
    t.len(r, 4);
  });

  T.it('_filter() dengan allowedStatuses memfilter status', t => {
    const svc = makeService();
    const r   = svc._filter(sampleItems, { allowedStatuses: ['ACTIVE'] });
    t.len(r, 2);
    r.forEach(i => t.eq(i.status, 'ACTIVE'));
  });

  T.it('_filter() custom function bekerja', t => {
    const svc = makeService();
    const r   = svc._filter(sampleItems, { custom: i => i.value > 20 });
    t.len(r, 2);
  });

  T.it('_paginate() menghitung total, pages, dan data slice dengan benar', t => {
    const svc    = makeService();
    const result = svc._paginate(sampleItems, 1, 2);
    t.eq(result.meta.total, 4);
    t.eq(result.meta.pages, 2);
    t.eq(result.meta.page,  1);
    t.len(result.data, 2);
  });

  T.it('_paginate() halaman terakhir berisi sisa item', t => {
    const svc    = makeService();
    const result = svc._paginate(sampleItems, 2, 3);
    t.len(result.data, 1);
  });

  T.it('_parseJsonFields() meng-parse field string JSON menjadi object', t => {
    const svc   = makeService();
    const items = [{ id: '1', meta: '{"a":1}' }];
    const r     = svc._parseJsonFields(items, ['meta']);
    t.deepEq(r[0].meta, { a: 1 });
  });

  T.it('_parseJsonFields() tidak throw jika JSON tidak valid', t => {
    const svc   = makeService();
    const items = [{ id: '1', meta: 'bukan json' }];
    t.notThrows(() => svc._parseJsonFields(items, ['meta']));
    t.eq(items[0].meta, 'bukan json');
  });
}

// ================================================================
// STRESS TEST: BULK INSERT (SheetDriver)
// ================================================================
function _stressBulkInsert(ssId) {
  T.suite(`Stress: Bulk Insert ${STRESS_ROW_COUNT} baris`);

  T.it(`append() ${STRESS_ROW_COUNT} baris ke STRESS_INSERT sheet`, t => {
    _resetSheet(ssId, 'STRESS_INSERT');
    const driver = new SheetDriver(ssId, 'STRESS_INSERT');
    const t0     = Date.now();

    for (let i = 1; i <= STRESS_ROW_COUNT; i++) {
      const now = new Date().toISOString();
      driver.append([
        Utilities.getUuid(),
        `Stress Item ${i}`,
        i % 3 === 0 ? 'catA' : i % 3 === 1 ? 'catB' : 'catC',
        i * 7,
        i % 4 === 0 ? 'INACTIVE' : 'ACTIVE',
        now,
        now
      ]);
    }

    const elapsed = Date.now() - t0;
    const rows    = driver.readRaw();
    t.eq(rows.length, STRESS_ROW_COUNT, `Harus ada ${STRESS_ROW_COUNT} baris`);
    console.log(`    ⏱ ${STRESS_ROW_COUNT} inserts: ${elapsed}ms (~${Math.round(elapsed/STRESS_ROW_COUNT)}ms/row)`);
  });
}

// ================================================================
// STRESS TEST: QUERY UNDER LOAD
// ================================================================
function _stressQueryLoad(ssId) {
  T.suite(`Stress: QueryBuilder ${STRESS_QUERY_REPS}x query pada ${STRESS_ROW_COUNT} baris`);

  T.it(`${STRESS_QUERY_REPS} filter queries berurutan`, t => {
    const driver = new SheetDriver(ssId, 'STRESS_INSERT');
    const KEYS   = ['id', 'name', 'category', 'value', 'status', 'createdAt', 'updatedAt'];
    const t0     = Date.now();
    let totalResults = 0;

    for (let q = 0; q < STRESS_QUERY_REPS; q++) {
      const r = new QueryBuilder(driver, KEYS)
        .where('status', '=', 'ACTIVE')
        .where('value', '>', 50)
        .orderBy('value', 'desc')
        .limit(10)
        .get();
      totalResults += r.length;
    }

    const elapsed = Date.now() - t0;
    t.gt(totalResults, 0, 'Harus ada hasil query');
    console.log(`    ⏱ ${STRESS_QUERY_REPS} queries: ${elapsed}ms (~${Math.round(elapsed/STRESS_QUERY_REPS)}ms/query), total results: ${totalResults}`);
  });

  T.it('whereLike() pada dataset besar', t => {
    const driver = new SheetDriver(ssId, 'STRESS_INSERT');
    const KEYS   = ['id', 'name', 'category', 'value', 'status', 'createdAt', 'updatedAt'];
    const t0     = Date.now();
    const r = new QueryBuilder(driver, KEYS).whereLike('name', 'Item 5').get();
    const elapsed = Date.now() - t0;
    t.gt(r.length, 0, 'LIKE harus menemukan hasil');
    console.log(`    ⏱ whereLike on ${STRESS_ROW_COUNT} rows: ${elapsed}ms, found: ${r.length}`);
  });

  T.it('whereIn() dengan 3 nilai pada dataset besar', t => {
    const driver = new SheetDriver(ssId, 'STRESS_INSERT');
    const KEYS   = ['id', 'name', 'category', 'value', 'status', 'createdAt', 'updatedAt'];
    const t0     = Date.now();
    const r = new QueryBuilder(driver, KEYS).whereIn('category', ['catA', 'catB']).get();
    const elapsed = Date.now() - t0;
    t.gt(r.length, 0);
    console.log(`    ⏱ whereIn catA+catB on ${STRESS_ROW_COUNT} rows: ${elapsed}ms, found: ${r.length}`);
  });

  T.it('readPage() pagination pada dataset besar', t => {
    const driver = new SheetDriver(ssId, 'STRESS_INSERT');
    const t0     = Date.now();
    let pages = 0;
    let page  = 1;
    let rows;
    do {
      rows = driver.readPage(page, 20);
      if (rows.length > 0) pages++;
      page++;
    } while (rows.length === 20);
    const elapsed = Date.now() - t0;
    t.eq(pages, Math.ceil(STRESS_ROW_COUNT / 20), `Halaman tidak cocok`);
    console.log(`    ⏱ ${pages} halaman paginated read: ${elapsed}ms`);
  });
}

// ================================================================
// STRESS TEST: PIPELINE THROUGHPUT
// ================================================================
function _stressPipeline() {
  T.suite(`Stress: Pipeline ${STRESS_PIPELINE_REPS}x executions`);

  const noopMw = { handle: ctx => { ctx.counter = (ctx.counter || 0) + 1; } };
  const logMw  = LoggingMiddleware;

  T.it(`${STRESS_PIPELINE_REPS} pipeline runs dengan 3 middleware`, t => {
    Logger.setRepository(null);
    const pipeline = new Pipeline([noopMw, logMw, noopMw]);
    const t0       = Date.now();

    for (let i = 0; i < STRESS_PIPELINE_REPS; i++) {
      pipeline.run({ counter: 0, action: `stress_action_${i}`, isRejected: false });
    }

    const elapsed = Date.now() - t0;
    console.log(`    ⏱ ${STRESS_PIPELINE_REPS} pipeline runs: ${elapsed}ms (~${Math.round(elapsed/STRESS_PIPELINE_REPS*1000)/1000}ms/run)`);
    t.lt(elapsed, 5000, 'Pipeline harus selesai dalam 5 detik');
  });

  T.it(`Pipeline dengan early termination: ${STRESS_PIPELINE_REPS} rejected runs`, t => {
    const rejecter = { handle: ctx => { ctx.isRejected = true; ctx.error = new AppError('stop'); } };
    const pipeline = new Pipeline([noopMw, rejecter, noopMw, noopMw]);
    const t0       = Date.now();
    let rejectCount = 0;

    for (let i = 0; i < STRESS_PIPELINE_REPS; i++) {
      const ctx = { counter: 0, isRejected: false };
      pipeline.run(ctx);
      if (ctx.isRejected) rejectCount++;
    }

    const elapsed = Date.now() - t0;
    t.eq(rejectCount, STRESS_PIPELINE_REPS, 'Semua run harus rejected');
    console.log(`    ⏱ ${STRESS_PIPELINE_REPS} rejected runs: ${elapsed}ms`);
  });
}

// ================================================================
// STRESS TEST: CACHE THROUGHPUT
// ================================================================
function _stressCache() {
  T.suite(`Stress: CacheDriver ${STRESS_CACHE_REPS}x set/get`);

  T.it(`${STRESS_CACHE_REPS} cache set + get roundtrips`, t => {
    const t0    = Date.now();
    const keys  = [];
    const value = { data: 'stress test value', n: 42, nested: { arr: [1, 2, 3] } };

    for (let i = 0; i < STRESS_CACHE_REPS; i++) {
      const key = `STRESS_CACHE_${i}_${Date.now()}`;
      keys.push(key);
      CacheDriver.set(key, value, 60);
    }

    let hits = 0;
    for (const key of keys) {
      const r = CacheDriver.get(key);
      if (r && r.n === 42) hits++;
    }

    const elapsed = Date.now() - t0;
    t.eq(hits, STRESS_CACHE_REPS, `Harus ${STRESS_CACHE_REPS} cache hits`);
    console.log(`    ⏱ ${STRESS_CACHE_REPS} cache roundtrips: ${elapsed}ms`);

    // Cleanup
    keys.forEach(k => CacheDriver.delete(k));
  });

  T.it(`CacheManager ${STRESS_CACHE_REPS}x versioned key operations`, t => {
    const t0  = Date.now();
    let hits  = 0;
    const grp = 'STRESS_GROUP';

    for (let i = 0; i < STRESS_CACHE_REPS; i++) {
      const id = `item_${i}`;
      CacheManager.set(grp, id, `val_${i}`, 60);
      const v = CacheManager.get(grp, id);
      if (v === `val_${i}`) hits++;
    }

    const elapsed = Date.now() - t0;
    t.eq(hits, STRESS_CACHE_REPS);
    console.log(`    ⏱ ${STRESS_CACHE_REPS} CacheManager ops: ${elapsed}ms`);
  });
}

// ================================================================
// STRESS TEST: EVENTBUS THROUGHPUT
// ================================================================
function _stressEventBus() {
  T.suite(`Stress: EventBus ${STRESS_EVENTBUS_REPS}x emit`);

  T.it(`${STRESS_EVENTBUS_REPS} emit() calls dengan 3 listeners`, t => {
    EventBus._listeners = {};
    let callCount = 0;
    EventBus.on('stress.event', { handle: _ => callCount++ });
    EventBus.on('stress.event', { handle: _ => callCount++ });
    EventBus.on('stress.event', { handle: _ => callCount++ });

    const t0 = Date.now();
    for (let i = 0; i < STRESS_EVENTBUS_REPS; i++) {
      EventBus.emit('stress.event', { index: i });
    }

    const elapsed  = Date.now() - t0;
    const expected = STRESS_EVENTBUS_REPS * 3;
    t.eq(callCount, expected, `Harus ${expected} total listener calls`);
    console.log(`    ⏱ ${STRESS_EVENTBUS_REPS} emits x 3 listeners = ${expected} calls: ${elapsed}ms`);
  });

  T.it(`${STRESS_EVENTBUS_REPS} emitSafe() dengan listener campuran (sukses & crash)`, t => {
    EventBus._listeners = {};
    let safeCount = 0;
    EventBus.on('stress.safe', { handle: _ => { throw new Error('intentional crash'); } });
    EventBus.on('stress.safe', { handle: _ => safeCount++ });

    const t0 = Date.now();
    for (let i = 0; i < STRESS_EVENTBUS_REPS; i++) {
      EventBus.emitSafe('stress.safe', { i });
    }

    const elapsed = Date.now() - t0;
    t.eq(safeCount, STRESS_EVENTBUS_REPS, 'Listener ke-2 harus selalu jalan');
    console.log(`    ⏱ ${STRESS_EVENTBUS_REPS} emitSafe: ${elapsed}ms`);
  });
}

// ================================================================
// STRESS TEST: Result Monad Throughput
// ================================================================
function _stressResult() {
  T.suite('Stress: Result Monad (10.000 operasi)');

  T.it('10.000 Result.ok + map + flatMap chain', t => {
    const t0 = Date.now();
    let sum  = 0;

    for (let i = 0; i < 10000; i++) {
      const r = Result.ok(i)
        .map(v => v * 2)
        .flatMap(v => Result.ok(v + 1))
        .getOrElse(0);
      sum += r;
    }

    const elapsed = Date.now() - t0;
    t.gt(sum, 0);
    console.log(`    ⏱ 10.000 Result chains: ${elapsed}ms, total sum: ${sum}`);
  });

  T.it('10.000 Result.try() dengan mixed success/fail', t => {
    const t0 = Date.now();
    let ok = 0, fail = 0;

    for (let i = 0; i < 10000; i++) {
      const r = Result.try(() => {
        if (i % 3 === 0) throw new Error('intentional');
        return i;
      });
      if (r.isOk()) ok++; else fail++;
    }

    const elapsed = Date.now() - t0;
    console.log(`    ⏱ 10.000 Result.try: ${elapsed}ms — ok: ${ok}, fail: ${fail}`);
    t.gt(ok, 0);
    t.gt(fail, 0);
  });
}

// ================================================================
// STRESS TEST: Validator Throughput
// ================================================================
function _stressValidator() {
  T.suite('Stress: Validator (5.000 validasi)');

  const schema = {
    name:   { required: true, type: 'string', minLength: 1, maxLength: 100 },
    value:  { required: true, type: 'number' },
    status: { required: false, type: 'string', enum: ['ACTIVE', 'INACTIVE'] }
  };

  T.it('5.000 Validator.validate() valid payload', t => {
    const t0 = Date.now();
    for (let i = 0; i < 5000; i++) {
      Validator.validate({ name: `Item ${i}`, value: i, status: 'ACTIVE' }, schema);
    }
    const elapsed = Date.now() - t0;
    console.log(`    ⏱ 5.000 validate() calls: ${elapsed}ms`);
  });

  T.it('5.000 Validator.validateSafe() dengan campuran valid/invalid', t => {
    const t0 = Date.now();
    let ok = 0, fail = 0;

    for (let i = 0; i < 5000; i++) {
      const data = i % 4 === 0
        ? {} // invalid: required fields missing
        : { name: `Item ${i}`, value: i };
      const r = Validator.validateSafe(data, schema);
      if (r.isOk()) ok++; else fail++;
    }

    const elapsed = Date.now() - t0;
    console.log(`    ⏱ 5.000 validateSafe: ${elapsed}ms — ok: ${ok}, fail: ${fail}`);
    t.gt(ok, 0);
    t.gt(fail, 0);
  });
}

// ================================================================
// STRESS TEST: DriveManager multiple uploads
// ================================================================
function _stressDriveManager() {
  T.suite('Stress: DriveManager (5 file uploads)');

  const b64Png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==';
  const uploadedIds = [];

  T.it('5 consecutive uploadBase64() ke folder target', t => {
    const t0 = Date.now();

    for (let i = 0; i < 5; i++) {
      const r = DriveManager.uploadBase64(b64Png, `stress_drive_${i}_${Date.now()}.png`, STRESS_FOLDER_ID);
      t.ok(r.id, `File ${i} harus punya ID`);
      uploadedIds.push(r.id);
    }

    const elapsed = Date.now() - t0;
    t.len(uploadedIds, 5);
    console.log(`    ⏱ 5 uploads ke Drive: ${elapsed}ms`);

    // Cleanup setelah test selesai
    uploadedIds.forEach(id => {
      try { DriveApp.getFileById(id).setTrashed(true); } catch (_) {}
    });
  });

  T.it('getThumbnailUrl() 1000x tanpa API call', t => {
    const t0 = Date.now();
    for (let i = 0; i < 1000; i++) {
      const url = DriveManager.getThumbnailUrl(`fake-id-${i}`, 'w400');
      if (!url.includes('fake-id')) throw new Error(`URL salah: ${url}`);
    }
    const elapsed = Date.now() - t0;
    console.log(`    ⏱ 1.000 getThumbnailUrl(): ${elapsed}ms`);
  });
}

// ================================================================
// STRESS TEST: E2E Container + Pipeline + Service
// ================================================================
function _stressE2E(ssId) {
  T.suite(`Stress: E2E Container + Pipeline + Service (${STRESS_PIPELINE_REPS}x)`);

  // Setup: buat service minimal yang bisa di-invoke via Container
  const SHEET = 'STRESS_QUERY';
  const KEYS  = ['id', 'name', 'category', 'value', 'status', 'createdAt', 'updatedAt'];

  // Isi data awal jika kosong
  const driver   = new SheetDriver(ssId, SHEET);
  const existing = driver.readRaw();
  if (existing.length === 0) {
    const now = new Date().toISOString();
    for (let i = 1; i <= 20; i++) {
      driver.append([Utilities.getUuid(), `E2E Item ${i}`, 'catA', i * 5, 'ACTIVE', now, now]);
    }
  }

  // Register di container
  Container.bind('E2ERepo', () => new BaseRepo(new SheetDriver(ssId, SHEET), KEYS, 2), true);
  Container.bind('E2EService', () => {
    const repo = Container.make('E2ERepo');
    return new BaseService(repo);
  }, true);

  T.it(`${STRESS_PIPELINE_REPS} E2E requests lewat Pipeline -> Container -> Service`, t => {
    Logger.setRepository(null);

    const pipeline = new Pipeline([
      LoggingMiddleware,
      { handle: ctx => { ctx.user = { email: 'e2e@test.com', role: 'ADMIN' }; } }
    ]);

    const t0      = Date.now();
    let successes = 0;

    for (let i = 0; i < STRESS_PIPELINE_REPS; i++) {
      const ctx = {
        action:     'getE2EItems',
        isRejected: false,
        payload:    { page: 1, limit: 10 }
      };

      pipeline.run(ctx);

      if (!ctx.isRejected) {
        const svc  = Container.make('E2EService');
        const items = svc.repo.query().where('status', '=', 'ACTIVE').limit(10).get();
        if (items.length > 0) successes++;
      }
    }

    const elapsed = Date.now() - t0;
    t.eq(successes, STRESS_PIPELINE_REPS, `Semua ${STRESS_PIPELINE_REPS} request harus sukses`);
    console.log(`    ⏱ ${STRESS_PIPELINE_REPS} E2E runs: ${elapsed}ms (~${Math.round(elapsed/STRESS_PIPELINE_REPS)}ms/req)`);
  });
}

// ================================================================
// STRESS TEST: Concurrent Auth Sessions
// ================================================================
function _stressAuth() {
  T.suite('Stress: Auth Session (50 sesi concurrent)');

  T.it('50 createSession() bersamaan (simulasi multi-user)', t => {
    const sessions = [];
    const t0       = Date.now();

    for (let i = 0; i < 50; i++) {
      const token = AuthService.createSession({
        email: `user${i}@test.com`,
        role:  i % 3 === 0 ? 'ADMIN' : 'USER',
        name:  `User ${i}`
      });
      sessions.push({ token, email: `user${i}@test.com` });
    }

    const elapsed = Date.now() - t0;
    t.eq(sessions.length, 50);

    // Validasi semua sesi masih aktif
    let valid = 0;
    sessions.forEach(s => {
      const u = AuthService.validateToken(s.token);
      if (u && u.email === s.email) valid++;
    });
    t.eq(valid, 50, '50 sesi harus bisa divalidasi');
    console.log(`    ⏱ 50 sesi create+validate: ${elapsed}ms`);

    // Cleanup: destroy semua sesi
    sessions.forEach(s => AuthService.destroySession(s.token));
  });
}

// ================================================================
// MAIN ENTRY POINTS
// ================================================================

/**
 * Jalankan SEMUA test (unit + integration + stress).
 * Estimasi waktu: 3-8 menit tergantung quota Drive/Cache.
 */
function runAllTests() {
  console.log('\n' + '█'.repeat(60));
  console.log('  GsLibraries Framework — FULL STRESS TEST SUITE');
  console.log('  ' + new Date().toISOString());
  console.log('█'.repeat(60));

  T.reset();

  // 1. Setup infrastructure
  const ssId = _getOrCreateStressSheet();
  console.log(`\n  📊 Spreadsheet: https://docs.google.com/spreadsheets/d/${ssId}`);
  console.log(`  📁 Drive Folder: ${STRESS_FOLDER_ID}\n`);

  // Setup Logger untuk test
  const logDriver = new SheetDriver(ssId, 'LOG');
  Logger.setRepository(new LogRepository(logDriver, WriteGate));

  // Set APP_ENV = dev untuk debug logging
  PropertiesService.getScriptProperties().setProperty('APP_ENV', 'dev');
  EnvConfig._config = null; // force reload

  // 2. Jalankan semua test
  _testResult();
  _testAppError();
  _testAppUtils();
  _testDateUtils();
  _testValidator();
  _testPipeline();
  _testContainer();
  _testEventBus();
  _testCache();
  _testLogger(ssId);
  _testSheetDriver(ssId);
  _testQueryBuilder(ssId);
  _testBaseRepo(ssId);
  _testBaseService(ssId);
  _testDriveManager();
  _testAuthService();
  _testMiddleware();
  _testJobRunner();

  // 3. Stress Tests
  _stressBulkInsert(ssId);
  _stressQueryLoad(ssId);
  _stressPipeline();
  _stressCache();
  _stressEventBus();
  _stressResult();
  _stressValidator();
  _stressDriveManager();
  _stressAuth();
  _stressE2E(ssId);

  // 4. Print summary
  const summary = T.printSummary();

  // 5. Tulis report ke sheet
  _writeTestReport(ssId, T._suites);

  // 6. Final log ke sheet
  Logger.info('Stress test selesai', { ...summary, ssId });

  return summary;
}

/**
 * Hanya unit test (tidak ada operasi Drive/Sheet).
 * Estimasi waktu: <30 detik.
 */
function runUnitTests() {
  console.log('\n' + '─'.repeat(60));
  console.log('  GsLibraries — UNIT TESTS ONLY');
  console.log('─'.repeat(60));

  T.reset();
  Logger.setRepository(null);
  EnvConfig._config = null;

  _testResult();
  _testAppError();
  _testAppUtils();
  _testDateUtils();
  _testValidator();
  _testPipeline();
  _testContainer();
  _testEventBus();

  // Cache & Auth butuh GAS services tapi tidak butuh Drive/Sheet
  _testCache();
  _testAuthService();

  return T.printSummary();
}

/**
 * Hanya stress/load test.
 * Memerlukan spreadsheet yang sudah ada (atau akan membuat baru).
 */
function runStressTests() {
  console.log('\n' + '─'.repeat(60));
  console.log('  GsLibraries — STRESS / LOAD TESTS ONLY');
  console.log('─'.repeat(60));

  T.reset();
  Logger.setRepository(null);

  const ssId = _getOrCreateStressSheet();
  console.log(`  📊 Spreadsheet: https://docs.google.com/spreadsheets/d/${ssId}\n`);

  _stressBulkInsert(ssId);
  _stressQueryLoad(ssId);
  _stressPipeline();
  _stressCache();
  _stressEventBus();
  _stressResult();
  _stressValidator();
  _stressDriveManager();
  _stressAuth();
  _stressE2E(ssId);

  return T.printSummary();
}

/**
 * Hapus semua asset test: spreadsheet dan properti.
 */
function cleanupTestAssets() {
  const ssId = PropertiesService.getScriptProperties().getProperty(STRESS_PROP_KEY);
  if (ssId) {
    try {
      DriveApp.getFileById(ssId).setTrashed(true);
      console.log(`Spreadsheet ${ssId} dipindahkan ke Trash.`);
    } catch (e) {
      console.log(`Gagal hapus spreadsheet: ${e.message}`);
    }
    PropertiesService.getScriptProperties().deleteProperty(STRESS_PROP_KEY);
  } else {
    console.log('Tidak ada asset test yang perlu dihapus.');
  }

  // Cleanup props yang dibuat test
  PropertiesService.getScriptProperties().deleteProperties([
    'JOB_STATE_STRESS_MOCK_JOB',
    'JOB_STATE_COMPLETION_TEST_JOB',
    'JOB_STATE_EMPTY_JOB',
    'JOB_STATE_STRESS_STATE_ROUNDTRIP',
    'CACHE_VER_TEST_GROUP',
    'CACHE_VER_INVAL_GROUP',
    'CACHE_VER_STRESS_GROUP'
  ]);
  EnvConfig._config = null;
  console.log('Cleanup selesai.');
}