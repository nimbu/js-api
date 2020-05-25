import { request, RequestMethod, RequestOptions } from '../src/request';
import { Client } from '../src/client';

jest.mock('../src/request');
const mockRequest = (request as unknown) as jest.Mock<
  ReturnType<typeof request>,
  Parameters<typeof request>
>;
mockRequest.mockImplementation(async () => {
  return new Response(
    JSON.stringify({
      id: 'mocked',
    })
  );
});

const mockEnsureFresh = jest.fn(async () => {
  return 'dummy-token';
});
const mockLogin = jest.fn(async () => false);
const mockLogout = jest.fn();

jest.mock('../src/auth', () => {
  return {
    Auth: jest.fn().mockImplementation(function() {
      return { ensureFresh: mockEnsureFresh, login: mockLogin, logout: mockLogout };
    }),
  };
});

describe('Client', () => {
  beforeEach(() => {
    mockRequest.mockClear();
    mockEnsureFresh.mockClear();
    mockLogin.mockClear();
    mockLogout.mockClear();
  });

  const client = new Client('my client id');
  it('gets the correct (parsed) value', async () => {
    const value = await client.get('/');

    expect(value).toMatchObject({ id: 'mocked' });
  });

  it('makes sure there is a fresh token', async () => {
    await client.get('/');
    expect(mockEnsureFresh).toBeCalledTimes(1);
  });

  it('sets the token for the request', async () => {
    await client.get('/');

    expect(mockRequest).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ token: 'dummy-token' }),
      undefined
    );
  });

  it('passed the correct path', async () => {
    await client.get('/');

    expect(mockRequest).toBeCalledWith(expect.anything(), '/', expect.anything(), undefined);
  });

  it('passes on the request options', async () => {
    const client = new Client('my client id', undefined, {
      userAgent: 'custom_user_agent',
      clientVersion: 'custom_client_version',
      host: 'http://api.nimbu.test',
      site: 'my_site',
    });

    await client.get('/');

    expect(mockRequest).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        userAgent: 'custom_user_agent',
        clientVersion: 'custom_client_version',
        host: 'http://api.nimbu.test',
        site: 'my_site',
      }),
      undefined
    );
  });

  describe('get', () => {
    it('uses the correct method', async () => {
      await client.get('/');

      expect(mockRequest).toBeCalledWith(
        RequestMethod.GET,
        expect.anything(),
        expect.anything(),
        undefined
      );
    });
  });

  describe('post', () => {
    it('uses the correct method', async () => {
      await client.post('/', { foo: 'bar' });

      expect(mockRequest).toBeCalledWith(
        RequestMethod.POST,
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('passes on the body', async () => {
      await client.post('/', { foo: 'bar' });

      expect(mockRequest).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        JSON.stringify({
          foo: 'bar',
        })
      );
    });
  });

  describe('put', () => {
    it('uses the correct method', async () => {
      await client.put('/', { foo: 'bar' });

      expect(mockRequest).toBeCalledWith(
        RequestMethod.PUT,
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('passes on the body', async () => {
      await client.put('/', { foo: 'bar' });

      expect(mockRequest).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        JSON.stringify({
          foo: 'bar',
        })
      );
    });
  });

  describe('patch', () => {
    it('uses the correct method', async () => {
      await client.patch('/', { foo: 'bar' });

      expect(mockRequest).toBeCalledWith(
        RequestMethod.PATCH,
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
    });

    it('passes on the body', async () => {
      await client.patch('/', { foo: 'bar' });

      expect(mockRequest).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        JSON.stringify({
          foo: 'bar',
        })
      );
    });
  });

  describe('delete', () => {
    it('uses the correct method', async () => {
      await client.delete('/');

      expect(mockRequest).toBeCalledWith(
        RequestMethod.DELETE,
        expect.anything(),
        expect.anything(),
        undefined
      );
    });
  });

  describe('request', () => {
    it('throws an exception on non-2xx responses', async () => {
      mockRequest.mockReturnValueOnce(
        Promise.resolve(
          new Response('', {
            status: 401,
            statusText: 'Unauthorized',
          })
        )
      );
      await expect(client.request(RequestMethod.GET, '/')).rejects.toThrowError(
        'Unauthorized (401)'
      );
    });

    it('returns an empty respons on 204', async () => {
      mockRequest.mockReturnValueOnce(
        Promise.resolve(
          new Response('', {
            status: 204,
          })
        )
      );

      await expect(client.request(RequestMethod.DELETE, '/')).resolves.toBe(undefined);
    });

    it('stringifies the body', async () => {
      const DUMMY = { foo: 'bar' };
      mockRequest.mockImplementationOnce(
        async (
          method: RequestMethod,
          path: string,
          options: RequestOptions,
          body?: RequestInit['body']
        ) => {
          expect(body).toBe(JSON.stringify(DUMMY));
          return new Response(
            JSON.stringify({
              id: 'mocked',
            })
          );
        }
      );

      expect.assertions(1);
      await client.request<{ id: string }>(RequestMethod.POST, '/', DUMMY);
    });
  });

  describe('login', () => {
    it('calls login on Auth', async () => {
      await expect(client.login('user@example.com', 'dummy')).resolves.toBe(false);
      expect(mockLogin).toBeCalledWith('user@example.com', 'dummy', false);
    });

    it('it passed remember to Auth', async () => {
      await client.login('user@example.com', 'dummy', true);
      expect(mockLogin).toBeCalledWith('user@example.com', 'dummy', true);
    });

    it('correctly passed authentication result', async () => {
      mockLogin.mockImplementationOnce(async () => true);
      expect(client.login('user@example.com', 'dummy')).resolves.toBe(true);
    });
  });

  describe('logout', () => {
    it('calls logout on Auth', async () => {
      await client.logout();
      expect(mockLogout).toBeCalled();
    });
  });

  describe('me', () => {
    /* eslint-disable @typescript-eslint/camelcase */
    const DUMMY_CUSTOMERS_ME_RESPONSE = {
      created_at: '2020-05-08T12:25:04.021Z',
      email: 'user@example.com',
      firstname: 'John',
      id: '1',
      language: 'en',
      lastname: 'Doe',
      name: 'John Doe',
      number: '202000000001',
      password_updated_at: '2020-05-08T12:25:04.021Z',
      slug: 'john-doe',
      status: 'active',
      updated_at: '2020-05-08T12:25:04.021Z',
    };
    /* eslint-enable @typescript-eslint/camelcase */

    it('it requests /customers/me', async () => {
      mockRequest.mockImplementationOnce(async (method: RequestMethod, path: string) => {
        expect(method).toBe(RequestMethod.GET);
        expect(path).toBe('/customers/me');
        return new Response(JSON.stringify(DUMMY_CUSTOMERS_ME_RESPONSE));
      });

      expect.assertions(2);
      await client.me();
    });

    it('returns the customer', async () => {
      mockRequest.mockReturnValueOnce(
        Promise.resolve(new Response(JSON.stringify(DUMMY_CUSTOMERS_ME_RESPONSE)))
      );

      await expect(client.me()).resolves.toMatchObject(DUMMY_CUSTOMERS_ME_RESPONSE);
    });

    it('throw an error for an invalid session', () => {
      mockRequest.mockReturnValueOnce(Promise.resolve(new Response('', { status: 401 })));

      expect(client.me()).rejects.toThrowError('Unauthorized (401)');
    });

    it('throws an error on other errors', () => {
      mockRequest.mockReturnValueOnce(Promise.resolve(new Response('', { status: 500 })));

      expect(client.me()).rejects.toThrowError('Internal Server Error (500)');
    });
  });

  describe('request password reset', () => {
    it('posts the email to /customers/password/reset', async () => {
      await expect(client.requestPasswordReset('john.doe@example.com')).resolves.toBe(undefined);
      expect(mockRequest).toBeCalledWith(
        RequestMethod.POST,
        '/customers/password/reset',
        expect.anything(),
        JSON.stringify({ email: 'john.doe@example.com' })
      );
    });
  });
});
