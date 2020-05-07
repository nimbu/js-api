import { request, RequestMethod, ResponseBody, RequestBody, RequestOptions } from './request';

export type ClientOptions = {
  host?: string;
  site?: string;
  userAgent?: string;
  clientVersion?: string;
};

export class Client {
  #options: RequestOptions;

  constructor(token: string, options: ClientOptions = {}) {
    this.#options = Object.assign({}, options, { token });
  }

  get<T extends ResponseBody>(path: string): Promise<T> {
    return request<T>(RequestMethod.GET, path, this.#options);
  }

  post<T extends ResponseBody>(path: string, body: RequestBody): Promise<T> {
    return request<T>(RequestMethod.POST, path, this.#options, body);
  }

  put<T extends ResponseBody>(path: string, body: RequestBody): Promise<T> {
    return request<T>(RequestMethod.PUT, path, this.#options, body);
  }

  patch<T extends ResponseBody>(path: string, body: RequestBody): Promise<T> {
    return request<T>(RequestMethod.PATCH, path, this.#options, body);
  }

  delete(path: string): Promise<void> {
    return request(RequestMethod.DELETE, path, this.#options);
  }
}
