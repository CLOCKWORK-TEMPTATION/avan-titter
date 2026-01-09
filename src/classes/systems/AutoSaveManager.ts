/**
 * @class AutoSaveManager
 * @description إدارة الحفظ التلقائي مع تتبع التغييرات غير المحفوظة
 */
export class AutoSaveManager {
  private autoSaveInterval: number | null = null;
  private currentContent = "";
  private lastSaved = "";
  private hasUnsavedChanges = false;
  private saveCallback: ((content: string) => Promise<void>) | null = null;
  private intervalMs = 30000;

  constructor(intervalMs: number = 30000) {
    this.intervalMs = intervalMs;
  }

  start(saveCallback: (content: string) => Promise<void>) {
    this.saveCallback = saveCallback;
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = window.setInterval(() => {
      this.performAutoSave();
    }, this.intervalMs);
  }

  stop() {
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  updateContent(content: string) {
    this.currentContent = content;
    this.hasUnsavedChanges = this.currentContent !== this.lastSaved;
  }

  async performAutoSave() {
    if (this.hasUnsavedChanges && this.saveCallback) {
      try {
        await this.saveCallback(this.currentContent);
        this.lastSaved = this.currentContent;
        this.hasUnsavedChanges = false;
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    }
  }

  async forceSave() {
    if (this.saveCallback) {
      try {
        await this.saveCallback(this.currentContent);
        this.lastSaved = this.currentContent;
        this.hasUnsavedChanges = false;
      } catch (error) {
        console.error("Force save failed:", error);
      }
    }
  }

  getUnsavedChanges() {
    return this.hasUnsavedChanges;
  }

  setSaveCallback(callback: (content: string) => Promise<void>) {
    this.saveCallback = callback;
  }

  startAutoSave() {
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
    }
    this.autoSaveInterval = window.setInterval(() => {
      this.performAutoSave();
    }, this.intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      window.clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}
