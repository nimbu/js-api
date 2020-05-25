import { request, RequestMethod, RequestOptions } from './request';
import { CustomFields, Customer } from './types';
import { Auth } from './auth';

export type ClientOptions = {
  remember?: boolean;
  host?: string;
  site?: string;
  userAgent?: string;
  clientVersion?: string;
};

export type RequestBody = unknown;

export class Client {
  private auth: Auth;
  private requestOptions: RequestOptions;

  constructor(clientId: string, token?: string, options: ClientOptions = {}) {
    this.auth = new Auth(clientId, {
      refreshToken: token,
      requestOptions: {
        host: options.host,
        userAgent: options.userAgent,
        clientVersion: options.clientVersion,
      },
      remember: options.remember,
    });
    this.requestOptions = {
      host: options.host,
      site: options.site,
      userAgent: options.userAgent,
      clientVersion: options.clientVersion,
    };
  }

  async fetch(method: RequestMethod, path: string, body?: RequestInit['body']): Promise<Response> {
    const token = await this.auth.ensureFresh();
    if (token != null) {
      return request(method, path, Object.assign({}, this.requestOptions, { token }), body);
    } else {
      throw new Error('Could not authenticate.');
    }
  }

  request(method: RequestMethod.DELETE, path: string): Promise<void>;
  request<T>(method: RequestMethod, path: string, body?: RequestBody): Promise<T>;
  async request<T>(method: RequestMethod, path: string, body?: RequestBody): Promise<T | void> {
    const requestBody = body != null ? JSON.stringify(body) : undefined;
    const response = await this.fetch(method, path, requestBody);
    if (response.ok) {
      if (response.status !== 204) {
        return response.json() as Promise<T>;
      } else {
        return Promise.resolve();
      }
    } else {
      // TODO: also handle 422 - Unprocessable Entity
      throw new Error(`${response.statusText} (${response.status})`);
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(RequestMethod.GET, path);
  }

  post<T>(path: string, body: RequestBody): Promise<T> {
    return this.request<T>(RequestMethod.POST, path, body);
  }

  put<T>(path: string, body: RequestBody): Promise<T> {
    return this.request<T>(RequestMethod.PUT, path, body);
  }

  patch<T>(path: string, body: RequestBody): Promise<T> {
    return this.request<T>(RequestMethod.PATCH, path, body);
  }

  delete(path: string): Promise<void> {
    return this.request(RequestMethod.DELETE, path);
  }

  async login(email: string, password: string, remember = false): Promise<boolean> {
    const success = await this.auth.login(email, password, remember);
    return success;
  }

  async me<T extends CustomFields>(): Promise<Customer<T>> {
    return this.get<Customer<T>>('/customers/me');
  }

  async logout(): Promise<void> {
    return this.auth.logout();
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.post('/customers/password/reset', { email });
  }
}
