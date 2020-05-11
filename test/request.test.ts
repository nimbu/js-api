import { request, RequestMethod, RequestOptions } from '../src/request';
import fetchMock from 'jest-fetch-mock';

const version = require('../package.json').version;

fetchMock.mockReject(new Error('Unexpected error'));

const DUMMY = { id: 'test ' };
const DUMMY_STRING = JSON.stringify(DUMMY);

const DEFAULT_OPTIONS: RequestOptions = {
  token: 'test_token',
};

describe('Request', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('correctly handles the defaults', async () => {
    fetchMock.once(async req => {
      expect(req.url).toMatch(/^https:\/\/api\.nimbu\.io/);
      expect(req.headers.get('User-Agent')).toBe(`nimbu-js-api/${version}`);
      expect(req.headers.get('X-Nimbu-Client-Version')).toBe(`nimbu-js-api/${version}`);
      expect(req.headers.get('Accept')).toBe('application/json');
      return DUMMY_STRING;
    });
    expect.assertions(4);
    await request(RequestMethod.GET, '/', DEFAULT_OPTIONS);
  });

  it('allows to specify a custom User Agent', async () => {
    fetchMock.once(async req => {
      expect(req.headers.get('User-Agent')).toBe('custom');
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request(
      RequestMethod.GET,
      '/',
      Object.assign({}, DEFAULT_OPTIONS, { userAgent: 'custom' })
    );
  });

  it('allows to specify a custom client version', async () => {
    fetchMock.once(async req => {
      expect(req.headers.get('X-Nimbu-Client-Version')).toBe('custom');
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request(
      RequestMethod.GET,
      '/',
      Object.assign({}, DEFAULT_OPTIONS, { clientVersion: 'custom' })
    );
  });

  it('sets the access token in the Authorization header', async () => {
    fetchMock.once(async req => {
      expect(req.headers.get('Authorization')).toBe(DEFAULT_OPTIONS.token);
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request(RequestMethod.GET, '/', DEFAULT_OPTIONS);
  });

  it('allows to specify a site', async () => {
    fetchMock.once(async req => {
      expect(req.headers.get('X-Nimbu-Site')).toBe('a_site');
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request(RequestMethod.GET, '/', Object.assign({}, DEFAULT_OPTIONS, { site: 'a_site' }));
  });

  it('allows to specify a session token', async () => {
    fetchMock.once(async req => {
      expect(req.headers.get('X-Nimbu-Session-Token')).toBe('dummy-session-token');
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request(
      RequestMethod.GET,
      '/',
      Object.assign({}, DEFAULT_OPTIONS, { sessionToken: 'dummy-session-token' })
    );
  });
});
