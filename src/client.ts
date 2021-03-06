import { request, RequestMethod, RequestOptions } from './request';
import { CustomFields, Customer } from './types';
import { Auth } from './auth';
import { ApiError } from './errors';

export type ClientOptions = {
  name?: string;
  clientSecret?: string;
  remember?: boolean;
  host?: string;
  site?: string;
  userAgent?: string;
  clientVersion?: string;
};

export type RequestBody = unknown;

export type ClientResponse<T> = {
  body: T;
  headers: Headers;
};

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
      name: options.name,
      clientSecret: options.clientSecret,
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
      throw new ApiError(401, 'Unauthorized');
    }
  }

  request(method: RequestMethod.DELETE, path: string): Promise<ClientResponse<void>>;
  request<T>(method: RequestMethod, path: string, body?: RequestBody): Promise<ClientResponse<T>>;
  async request<T>(
    method: RequestMethod,
    path: string,
    body?: RequestBody
  ): Promise<ClientResponse<T | void>> {
    const requestBody = body != null ? JSON.stringify(body) : undefined;
    const response = await this.fetch(method, path, requestBody);
    if (response.ok) {
      if (response.status !== 204) {
        const body = (await response.json()) as T;
        return {
          body,
          headers: response.headers,
        };
      } else {
        return {
          body: undefined,
          headers: response.headers,
        };
      }
    } else if (response.status === 422) {
      const { errors } = await response.json();
      throw new ApiError(response.status, response.statusText, errors);
    } else {
      throw new ApiError(response.status, response.statusText);
    }
  }

  get<T>(path: string): Promise<ClientResponse<T>> {
    return this.request<T>(RequestMethod.GET, path);
  }

  post<T>(path: string, body: RequestBody): Promise<ClientResponse<T>> {
    return this.request<T>(RequestMethod.POST, path, body);
  }

  put<T>(path: string, body: RequestBody): Promise<ClientResponse<T>> {
    return this.request<T>(RequestMethod.PUT, path, body);
  }

  patch<T>(path: string, body: RequestBody): Promise<ClientResponse<T>> {
    return this.request<T>(RequestMethod.PATCH, path, body);
  }

  delete(path: string): Promise<ClientResponse<void>> {
    return this.request(RequestMethod.DELETE, path);
  }

  async login(email: string, password: string, remember = false): Promise<boolean> {
    const success = await this.auth.login(email, password, remember);
    return success;
  }

  async me<T extends CustomFields>(): Promise<Customer<T>> {
    const response = await this.get<Customer<T>>('/customers/me');
    return response.body;
  }

  async logout(): Promise<void> {
    return this.auth.logout();
  }

  get remember(): boolean {
    return this.auth.remember;
  }
}
