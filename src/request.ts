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
  token?: string;
  site?: string;
  contentType?: string;
} & Partial<RequestOptionsWithDefault>;

const DEFAULT_OPTIONS: RequestOptionsWithDefault = {
  host: 'https://api.nimbu.io',
  userAgent: `nimbu-js-api/${version}`,
  clientVersion: `nimbu-js-api/${version}`,
};

export type RequestBody = Record<string, unknown> | Record<string, unknown>[];
export type ResponseBody = Record<string, unknown> | Record<string, unknown>[];

function mergeDefaults(_options: RequestOptions): RequestOptions & RequestOptionsWithDefault {
  return Object.assign({}, _options, {
    host: _options.host || DEFAULT_OPTIONS.host,
    userAgent: _options.userAgent || DEFAULT_OPTIONS.userAgent,
    clientVersion: _options.clientVersion || DEFAULT_OPTIONS.clientVersion,
  });
}

export function request(
  method: RequestMethod,
  path: string,
  _options: RequestOptions,
  body?: RequestInit['body']
): Promise<Response> {
  const options = mergeDefaults(_options);
  const url = `${options.host}${path}`;

  const headers: RequestInit['headers'] = {
    'User-Agent': options.userAgent,
    Accept: 'application/json',
    'X-Nimbu-Client-Version': options.clientVersion,
  };

  if (options.token != null) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  if (body != null && !(body instanceof FormData)) {
    headers['Content-Type'] = options.contentType || 'application/json';
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
