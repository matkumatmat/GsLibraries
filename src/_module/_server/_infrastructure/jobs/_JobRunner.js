// src/server/infrastructure/jobs/_JobRunner.js

class JobRunner {
  static get MAX_EXECUTION_TIME() { return 270000; } 
  static get STATE_PREFIX() { return 'JOB_STATE_'; }
  static get ACTIVE_JOB_KEY() { return 'ACTIVE_RESUME_JOB'; } // Penanda job apa yang harus di-resume

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
    const props = PropertiesService.getScriptProperties();
    props.deleteProperty(`${this.STATE_PREFIX}${jobName}`);
    props.deleteProperty(this.ACTIVE_JOB_KEY); // Bersihkan penanda antrean
  }

  /**
   * Menghapus trigger lama agar tidak melampaui kuota 20 trigger GAS
   */
  static _cleanupTriggers(functionName) {
    const triggers = ScriptApp.getProjectTriggers();
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === functionName) {
        ScriptApp.deleteTrigger(trigger);
      }
    }
  }

  static _scheduleResume(jobName) {
    const triggerFunctionName = 'jobEntryTrigger';
    
    // 1. Bersihkan trigger lama
    this._cleanupTriggers(triggerFunctionName);

    // 2. Tandai job apa yang harus di-resume oleh trigger nanti
    PropertiesService.getScriptProperties().setProperty(this.ACTIVE_JOB_KEY, jobName);

    // 3. Buat trigger baru
    ScriptApp.newTrigger(triggerFunctionName)
      .timeBased()
      .after(60 * 1000) 
      .create();
      
    Logger.info(`Waktu eksekusi hampir habis. Job ${jobName} dijadwalkan ulang (Resume).`);
  }

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

    for (let i = state.currentIndex; i < data.length; i++) {
      try {
        JobClass.handle(data[i], state);
      } catch (e) {
        Logger.error(`Job ${JobClass.jobName} error di index ${i}`, { item: data[i] }, e);
      }

      state.currentIndex = i + 1;
      state.totalProcessed++;

      // CEK WAKTU
      if (Date.now() - startTime > this.MAX_EXECUTION_TIME) {
        this._saveState(JobClass.jobName, state);
        this._scheduleResume(JobClass.jobName);
        return Result.ok(`Job ${JobClass.jobName} dipause sementara.`);
      }
    }

    this._clearState(JobClass.jobName);
    JobClass.onComplete(state);
    
    return Result.ok(`Job ${JobClass.jobName} sukses dijalankan 100%.`);
  }
}