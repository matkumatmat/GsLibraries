// src/server/testing/_TestRunner.js

class TestRunner {
  static runSuite(suiteName, testCases) {
    console.log(`\n--- 🧪 Memulai Test Suite: ${suiteName} ---`);
    let passed = 0;
    let failed = 0;

    for (const [testName, testFn] of Object.entries(testCases)) {
      try {
        testFn();
        passed++;
        console.log(`✅ [PASS] ${testName}`);
      } catch (e) {
        failed++;
        console.error(`❌ [FAIL] ${testName} -> ${e.message}`);
      }
    }

    console.log(`📊 Hasil ${suiteName} | PASS: ${passed} | FAIL: ${failed}`);
    if (failed > 0) {
      throw new Error(`Test Suite ${suiteName} gagal dengan ${failed} error.`);
    }
    
    return true;
  }
}

class Assert {
  static equal(actual, expected, msg = '') {
    if (actual !== expected) throw new Error(`${msg} (Diharapkan '${expected}', tapi dapat '${actual}')`);
  }
  
  static isTrue(value, msg = '') {
    if (value !== true) throw new Error(`${msg} (Diharapkan true, tapi dapat ${value})`);
  }

  static throws(fn, msg = '') {
    try {
      fn();
      throw new Error(`${msg} (Diharapkan melempar error, tapi malah tembus sukses)`);
    } catch (e) {
      // Test passed karena melempar error
    }
  }
}