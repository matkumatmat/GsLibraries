// src/server/infrastructure/jobs/_JobRunner.js

/**
 * JobRunner
 * Single responsibility: Mengeksekusi Job, memantau limit waktu GAS (6 Menit), 
 * menyimpan state, dan menjadwalkan pelanjutan (Resume) jika waktu hampir habis.
 */
class JobRunner {
  // Kita set batas aman di 4.5 menit (270.000 ms) dari batas total 6 menit
  static get MAX_EXECUTION_TIME() { return 270000; } 
  static get STATE_PREFIX() { return 'JOB_STATE_'; }

  static _saveState(jobName, state) {
    PropertiesService.getScriptProperties().setProperty(
      `${this.STATE_PREFIX}${jobName}`, 
      JSON.stringify(state)
    );
  }

  static _loadState(jobName) {
    const raw = PropertiesService.getScriptProperties().getProperty(`${this.STATE_PREFIX}${jobName}`);
    return raw ? JSON.parse(raw) : null;
  }

  static _clearState(jobName) {
    PropertiesService.getScriptProperties().deleteProperty(`${this.STATE_PREFIX}${jobName}`);
  }

  /**
   * Menjadwalkan Trigger baru untuk melanjutkan script 1 menit kemudian
   */
  static _scheduleResume(jobName) {
    // Fungsi 'jobEntryTrigger' ini harus didaftarkan di main.js nanti
    ScriptApp.newTrigger('jobEntryTrigger')
      .timeBased()
      .after(60 * 1000) // Jalan 1 menit dari sekarang
      .create();
      
    Logger.info(`Waktu eksekusi hampir habis. Job ${jobName} dijadwalkan ulang (Resume).`);
  }

  /**
   * Mengeksekusi Job Class yang dituju
   */
  static execute(JobClass, initialState = {}) {
    const startTime = Date.now();
    let state = this._loadState(JobClass.jobName) || { 
      currentIndex: 0, 
      totalProcessed: 0,
      ...initialState 
    };

    const data = JobClass.getData(state);

    if (!data || data.length === 0 || state.currentIndex >= data.length) {
      this._clearState(JobClass.jobName);
      JobClass.onComplete(state);
      return Result.ok(`Job ${JobClass.jobName} selesai diproses.`);
    }

    Logger.info(`Memulai/Melanjutkan Job ${JobClass.jobName} dari index ${state.currentIndex} / ${data.length}`);

    // Loop pemrosesan data
    for (let i = state.currentIndex; i < data.length; i++) {
      
      // Eksekusi logika bisnis dari subclass
      try {
        JobClass.handle(data[i], state);
      } catch (e) {
        Logger.error(`Job ${JobClass.jobName} error di index ${i}`, { item: data[i] }, e);
        // Tergantung kebutuhan: bisa continue, atau throw error. Di sini kita lanjut ke item berikutnya.
      }

      state.currentIndex = i + 1;
      state.totalProcessed++;

      // CEK WAKTU: Apakah kita sudah mendekati batas 6 menit?
      if (Date.now() - startTime > this.MAX_EXECUTION_TIME) {
        this._saveState(JobClass.jobName, state);
        this._scheduleResume(JobClass.jobName);
        return Result.ok(`Job ${JobClass.jobName} dipause sementara (Mendekati Timeout).`);
      }
    }

    // Jika berhasil keluar dari loop tanpa kena timeout
    this._clearState(JobClass.jobName);
    JobClass.onComplete(state);
    
    return Result.ok(`Job ${JobClass.jobName} sukses dijalankan 100%.`);
  }
}