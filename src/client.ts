import { request, RequestMethod, ResponseBody } from './request';

export type ClientOptions = {
  host?: string;
  site?: string;
  userAgent?: string;
  clientVersion?: string;
};

export class Client {
  token: string;
  options: ClientOptions;

  constructor(token: string, options: ClientOptions = {}) {
    this.token = token;
    this.options = options;
  }

  get<T extends ResponseBody>(path: string): Promise<T> {
    return request<T>(RequestMethod.GET, path, {
      token: this.token,
      host: this.options.host,
      site: this.options.site,
      userAgent: this.options.userAgent,
      clientVersion: this.options.clientVersion,
    });
  }
}
