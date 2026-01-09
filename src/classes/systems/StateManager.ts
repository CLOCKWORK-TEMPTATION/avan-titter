/**
 * @class StateManager
 * @description إدارة الحالة المركزية مع نظام الاشتراكات
 */
export class StateManager {
  private state = new Map();
  private subscribers = new Map();

  subscribe(key: string, callback: (value: any) => void) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);
    return () => {
      const callbacks = this.subscribers.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  setState(key: string, value: any) {
    this.state.set(key, value);
    const callbacks = this.subscribers.get(key) || [];
    callbacks.forEach((callback: (value: any) => void) => callback(value));
  }

  getState(key: string) {
    return this.state.get(key);
  }

  getAllState() {
    return Object.fromEntries(this.state);
  }

  clearState() {
    this.state.clear();
  }

  deleteState(key: string) {
    this.state.delete(key);
    const callbacks = this.subscribers.get(key) || [];
    callbacks.forEach((callback: (value: any) => void) => callback(undefined));
  }
}
