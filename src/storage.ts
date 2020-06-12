export type Storage = {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
};

const webSessionStorage: Storage = {
  async setItem(key: string, value: string): Promise<void> {
    globalThis.sessionStorage.setItem(key, value);
  },
  async getItem(key: string): Promise<string | null> {
    return globalThis.sessionStorage.getItem(key);
  },
  async removeItem(key: string): Promise<void> {
    globalThis.sessionStorage.removeItem(key);
  },
};

const noopStorage: Storage = {
  async setItem(): Promise<void> {
    // ILB
  },
  async getItem(): Promise<string | null> {
    return null;
  },
  async removeItem(): Promise<void> {
    // ILB
  },
};

export const sessionStorage: Storage = 'sessionStorage' in globalThis ? webSessionStorage : noopStorage;

const localStorage: Storage = {
  async setItem(key: string, value: string): Promise<void> {
    globalThis.localStorage.setItem(key, value);
  },
  async getItem(key: string): Promise<string | null> {
    return globalThis.localStorage.getItem(key);
  },
  async removeItem(key: string): Promise<void> {
    globalThis.localStorage.removeItem(key);
  },
};

export const persistentStorage: Storage = 'localStorage' in globalThis ? localStorage : noopStorage;
