import { request, RequestMethod, RequestOptions } from './request';
import { Customer, CurrentCustomer } from 'types';

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

  async login(email: string, password: string): Promise<CurrentCustomer> {
    const customer = await this.post<CurrentCustomer>('/customers/login', {
      username: email,
      password,
    });

    this.#options.sessionToken = customer.session_token;

    return customer;
  }
}
