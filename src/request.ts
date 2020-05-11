// import { version } from '../package.json';

const version = require('../package.json').version;

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

export function request(
  method: RequestMethod,
  path: string,
  _options: RequestOptions,
  body?: RequestInit['body']
): Promise<Response> {
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

  return fetch(url, {
    method,
    mode: 'cors',
    headers,
    body,
  });
}
