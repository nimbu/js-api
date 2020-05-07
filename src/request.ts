import { version } from '../package.json';

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

type RequestOptionsWithDefault = {
  host: string;
  userAgent: string;
  clientVersion: string;
};

export type RequestOptions = {
  token: string;
  sessionToken?: string;
  site?: string;
} & Partial<RequestOptionsWithDefault>;

const DEFAULT_OPTIONS: RequestOptionsWithDefault = {
  host: 'https://api.nimbu.io',
  userAgent: `nimbu-js-api/${version}`,
  clientVersion: `nimbu-js-api/${version}`,
};

export type RequestBody = Record<string, unknown> | Record<string, unknown>[];
export type ResponseBody = Record<string, unknown> | Record<string, unknown>[];

export async function request(
  method: RequestMethod,
  path: string,
  options: RequestOptions
): Promise<void>;
export async function request<T extends ResponseBody>(
  method: RequestMethod,
  path: string,
  options: RequestOptions,
  body?: RequestBody
): Promise<T>;
export async function request<T>(
  method: RequestMethod,
  path: string,
  _options: RequestOptions,
  body?: RequestBody
): Promise<T | void> {
  const options = Object.assign({}, DEFAULT_OPTIONS, _options);
  const url = `${options.host}${path}`;

  const headers: RequestInit['headers'] = {
    Authorization: options.token,
    'User-Agent': options.userAgent,
    Accept: 'application/json',
    'X-Nimbu-Client-Version': options.clientVersion,
  };

  if (body != null) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.site != null) {
    headers['X-Nimbu-Site'] = options.site;
  }

  const response = await fetch(url, {
    method,
    mode: 'cors',
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

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
