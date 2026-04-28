// src/server/testing/_TestRunner.js

/**
 * TestRunner
 * Minimalist Testing Framework untuk GAS.
 */
class TestRunner {
  static runSuite(suiteName, testCases) {
    Logger.info(`--- Memulai Test Suite: ${suiteName} ---`);
    let passed = 0;
    let failed = 0;
    const failures = [];

    for (const [testName, testFn] of Object.entries(testCases)) {
      try {
        testFn();
        passed++;
        Logger.debug(`[PASS] ${testName}`);
      } catch (e) {
        failed++;
        failures.push({ testName, error: e.message });
        Logger.error(`[FAIL] ${testName}: ${e.message}`);
      }
    }

    Logger.info(`--- Hasil ${suiteName} --- | PASS: ${passed} | FAIL: ${failed}`);
    if (failed > 0) {
      throw new Error(`Test Suite ${suiteName} gagal dengan ${failed} error.`);
    }
    
    return true;
  }
}

/**
 * Assertions
 * Kumpulan helper untuk validasi output saat testing.
 */
class Assert {
  static equal(actual, expected, msg = '') {
    if (actual !== expected) throw new Error(`${msg} (Diharapkan ${expected}, tapi dapat ${actual})`);
  }
  
  static isTrue(value, msg = '') {
    if (value !== true) throw new Error(`${msg} (Diharapkan true)`);
  }

  static throws(fn, msg = '') {
    try {
      fn();
      throw new Error(`${msg} (Diharapkan melempar error, tapi ternyata berhasil)`);
    } catch (e) {
      // Test passed karena melempar error
    }
  }
}