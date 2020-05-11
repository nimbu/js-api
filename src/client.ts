import { request, RequestMethod, RequestOptions } from './request';
import { CurrentCustomer, CustomFields, Customer } from './types';

export type ClientOptions = {
  host?: string;
  site?: string;
  userAgent?: string;
  clientVersion?: string;
};

export type RequestBody = unknown;

export class Client {
  #options: RequestOptions;

  constructor(token: string, options: ClientOptions = {}) {
    this.#options = Object.assign({}, options, { token });
  }

  fetch(method: RequestMethod, path: string, body?: RequestInit['body']): Promise<Response> {
    return request(method, path, this.#options, body);
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

  async login<T extends CustomFields>(
    email: string,
    password: string
  ): Promise<CurrentCustomer<T>> {
    const customer = await this.post<CurrentCustomer<T>>('/customers/login', {
      username: email,
      password,
    });

    this.#options.sessionToken = customer.session_token;

    return customer;
  }

  async validateSession<T extends CustomFields>(sessionToken: string): Promise<Customer<T> | undefined> {
    this.#options.sessionToken = sessionToken;
    const response = await this.fetch(RequestMethod.GET, '/customers/me');
    if (response.ok) {
      return response.json() as Promise<Customer<T>>;
    } else {
      this.#options.sessionToken = undefined;
      if (response.status === 401) {
        // Unauthorized: expected if session is no longer valid
        return undefined;
      } else {
        // We got an another error -> throw
        throw new Error(`${response.statusText} (${response.status})`);
      }
    }
  }

  async logout(): Promise<void> {
    // NOTE: In the future this might invalidate the session token in nimbu ->
    // make it async
    this.#options.sessionToken = undefined;
  }
}
