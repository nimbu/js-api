import { request, RequestMethod, RequestOptions } from './request';
import { Storage, sessionStorage, persistentStorage } from './storage';

type AuthRequestOptions = Omit<RequestOptions, 'token' | 'site' | 'contentType'>;

export type AuthOptions = {
  name?: string;
  clientSecret?: string;
  refreshToken?: string;
  scope?: string[];
  requestOptions?: AuthRequestOptions;
  remember?: boolean;
  sessionStorage?: Storage;
  persistentStorage?: Storage;
};

type AccessToken = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

export class Auth {
  private clientId: string;
  private clientSecret?: string;
  private name?: string;
  private requestOptions: AuthRequestOptions;

  // OAuth token related
  private scope?: string[];
  private accessToken: string | undefined;
  private refreshToken: string | undefined;
  // We keep expiredAt in milliseconds since the epoch
  private expiresAt: number | undefined;

  // Persistence
  private sessionStorage: Storage;
  private persistentStorage: Storage;
  private remember: boolean;
  private restored = false;

  constructor(clientId: string, options?: AuthOptions) {
    this.clientId = clientId;
    this.clientSecret = options?.clientSecret;
    this.requestOptions = options?.requestOptions || {};
    this.refreshToken = options?.refreshToken;
    this.scope = options?.scope;
    this.sessionStorage = options?.sessionStorage || sessionStorage;
    this.persistentStorage = options?.persistentStorage || persistentStorage;
    this.remember = options?.remember || false;
    this.name = options?.name;
  }

  private get sessionStorageKey(): string {
    return `nimbu-${this.clientId}${this.name != null ? `-${this.name}` : ''}-oauth2`;
  }

  private get persistentStorageKey(): string {
    return `nimbu-${this.clientId}${this.name != null ? `-${this.name}` : ''}-refresh`;
  }

  private get needsRefresh(): boolean {
    if (this.accessToken == null) {
      return true;
    } else if (this.expiresAt == null) {
      return false;
    } else {
      // Use 10s leeway (in milliseconds)
      return this.expiresAt - 10000 < Date.now();
    }
  }

  private async restore(): Promise<void> {
    if (!this.restored) {
      if (this.sessionStorage != null) {
        const json = await this.sessionStorage.getItem(this.sessionStorageKey);
        if (json != null) {
          const { accessToken, expiresAt, refreshToken, scope } = JSON.parse(json);
          this.accessToken = accessToken;
          this.expiresAt = expiresAt;
          this.scope = this.scope || scope;
          this.refreshToken = this.refreshToken || refreshToken;
        } else if (this.refreshToken == null) {
          // Try to restore at least the refreshToken
          const refreshToken = await this.persistentStorage.getItem(this.persistentStorageKey);
          if (this.refreshToken == null && refreshToken != null) {
            this.refreshToken = refreshToken;
          }
        }
      }
    }
    this.restored = true;
  }

  private async apply(token: AccessToken): Promise<void> {
    this.accessToken = token.access_token;
    this.expiresAt = Date.now() + token.expires_in * 1000; // expires_in is in seconds
    let newRefreshToken = false;
    if (token.refresh_token != null) {
      this.refreshToken = token.refresh_token;
      newRefreshToken = true;
    }
    if (this.sessionStorage != null) {
      await this.sessionStorage.setItem(
        this.sessionStorageKey,
        JSON.stringify({
          accessToken: this.accessToken,
          expiresAt: this.expiresAt,
          refreshToken: this.refreshToken,
          scope: this.scope,
        })
      );
    }
    if (this.remember && newRefreshToken && this.refreshToken != null) {
      await this.persistentStorage.setItem(this.persistentStorageKey, this.refreshToken);
    }
  }

  async refresh(): Promise<string | undefined> {
    await this.restore();
    if (this.refreshToken == null) {
      throw new Error(`No refresh token available`);
    }
    const form = new FormData();
    form.append('client_id', this.clientId);
    if(this.clientSecret != null) {
      form.append('client_secret', this.clientSecret);
    }
    form.append('grant_type', 'refresh_token');
    form.append('refresh_token', this.refreshToken);
    if (this.scope != null) {
      form.append('scope', this.scope.join(' '));
    }
    const response = await request(RequestMethod.POST, '/oauth2/tokens', this.requestOptions, form);
    if (response.status === 200) {
      const token: AccessToken = await response.json();
      await this.apply(token);
      return this.accessToken;
    } else {
      return undefined;
    }
  }

  async ensureFresh(): Promise<string | undefined> {
    await this.restore();
    if (this.needsRefresh) {
      // Fetch a token
      return this.refresh();
    } else {
      return this.accessToken;
    }
  }

  async login(username: string, password: string, remember = false): Promise<boolean> {
    await this.restore();
    this.remember = remember;
    const form = new FormData();
    form.append('client_id', this.clientId);
    form.append('grant_type', 'password');
    form.append('username', username);
    form.append('password', password);
    if (this.scope != null) {
      form.append('scope', this.scope.join(' '));
    }
    const response = await request(RequestMethod.POST, '/oauth2/tokens', this.requestOptions, form);
    if (response.status === 200) {
      const token: AccessToken = await response.json();
      await this.apply(token);
      return true;
    } else {
      return false;
    }
  }

  async logout(): Promise<void> {
    // NOTE: for now, we just erase our tokens, but we may support invalidating
    // the refresh token later on
    this.refreshToken = undefined;
    this.accessToken = undefined;
    this.expiresAt = undefined;

    await Promise.all([
      this.sessionStorage.removeItem(this.sessionStorageKey),
      this.persistentStorage.removeItem(this.persistentStorageKey),
    ]);
  }
}
