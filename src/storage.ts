export type Storage = {
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
};

const webSessionStorage: Storage = {
  async setItem(key: string, value: string): Promise<void> {
    window.sessionStorage.setItem(key, value);
  },
  async getItem(key: string): Promise<string | null> {
    return window.sessionStorage.getItem(key);
  },
  async removeItem(key: string): Promise<void> {
    window.sessionStorage.removeItem(key);
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

export const sessionStorage: Storage = 'sessionStorage' in window ? webSessionStorage : noopStorage;

const localStorage: Storage = {
  async setItem(key: string, value: string): Promise<void> {
    window.localStorage.setItem(key, value);
  },
  async getItem(key: string): Promise<string | null> {
    return window.localStorage.getItem(key);
  },
  async removeItem(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  },
};

export const persistentStorage: Storage = 'localStorage' in window ? localStorage : noopStorage;
