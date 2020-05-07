import { request, RequestMethod, RequestOptions } from '../request';
import fetchMock from 'jest-fetch-mock';
import { version } from '../../package.json';

fetchMock.mockReject(new Error('Unexpected error'));

const DUMMY = { id: 'test ' };
const DUMMY_STRING = JSON.stringify(DUMMY);

const DEFAULT_OPTIONS: RequestOptions = {
  token: 'test_token',
};

describe('Request', () => {
  beforeEach(() => fetchMock.resetMocks());

  it('correctly handles the defaults', async () => {
    fetchMock.once(async (req) => {
      expect(req.url).toMatch(/^https:\/\/api\.nimbu\.io/);
      expect(req.headers.get('User-Agent')).toBe(`nimbu-js-api/${version}`);
      expect(req.headers.get('X-Nimbu-Client-Version')).toBe(`nimbu-js-api/${version}`);
      expect(req.headers.get('Accept')).toBe('application/json');
      return DUMMY_STRING;
    });
    expect.assertions(4);
    await request<typeof DUMMY>(RequestMethod.GET, '/', DEFAULT_OPTIONS);
  });

  it('allows to specify a custom User Agent', async () => {
    fetchMock.once(async (req) => {
      expect(req.headers.get('User-Agent')).toBe('custom');
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request<typeof DUMMY>(
      RequestMethod.GET,
      '/',
      Object.assign({}, DEFAULT_OPTIONS, { userAgent: 'custom' })
    );
  });

  it('allows to specify a custom client version', async () => {
    fetchMock.once(async (req) => {
      expect(req.headers.get('X-Nimbu-Client-Version')).toBe('custom');
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request<typeof DUMMY>(
      RequestMethod.GET,
      '/',
      Object.assign({}, DEFAULT_OPTIONS, { clientVersion: 'custom' })
    );
  });

  it('sets the access token in the Authorization header', async () => {
    fetchMock.once(async (req) => {
      expect(req.headers.get('Authorization')).toBe(DEFAULT_OPTIONS.token);
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request<typeof DUMMY>(RequestMethod.GET, '/', DEFAULT_OPTIONS);
  });

  it('parses the response as json', async () => {
    fetchMock.once(DUMMY_STRING);
    const result = await request<typeof DUMMY>(RequestMethod.GET, '/', DEFAULT_OPTIONS);

    expect(result.id).toBe(DUMMY.id);
  });

  it('throws an exception on non-2xx responses', async () => {
    fetchMock.once('', { status: 401 });
    await expect(request(RequestMethod.GET, '/', DEFAULT_OPTIONS)).rejects.toThrowError(
      'Unauthorized (401)'
    );
  });

  it('returns an empty respons on 204', async () => {
    fetchMock.once('', { status: 204 });

    await expect(request(RequestMethod.DELETE, '/', DEFAULT_OPTIONS)).resolves.toBe(undefined);
  });

  it('stringifies the body', async () => {
    fetchMock.once(async (req) => {
      expect(`${req.body}`).toBe(DUMMY_STRING);
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request<typeof DUMMY>(RequestMethod.POST, '/', DEFAULT_OPTIONS, DUMMY);
  });

  it('allows to specify a site', async () => {
    fetchMock.once(async (req) => {
      expect(req.headers.get('X-Nimbu-Site')).toBe('a_site');
      return DUMMY_STRING;
    });
    expect.assertions(1);
    await request<typeof DUMMY>(
      RequestMethod.GET,
      '/',
      Object.assign({}, DEFAULT_OPTIONS, { site: 'a_site' })
    );
  });
});
