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

describe('Client', () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  const client = new Client('my token');
  it('gets the correct (parsed) value', async () => {
    const value = await client.get('/');

    expect(value).toMatchObject({ id: 'mocked' });
  });

  it('sets the token for the request', async () => {
    await client.get('/');

    expect(mockRequest).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ token: 'my token' }),
      undefined
    );
  });

  it('passed the correct path', async () => {
    await client.get('/');

    expect(mockRequest).toBeCalledWith(expect.anything(), '/', expect.anything(), undefined);
  });

  it('passes on the request options', async () => {
    const client = new Client('my token', {
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
    const client = new Client('my token');

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
    /* eslint-disable @typescript-eslint/camelcase */
    const DUMMY_LOGIN_RESPONSE = {
      created_at: '2020-05-08T12:25:04.021Z',
      email: 'user@example.com',
      firstname: 'John',
      id: '1',
      language: 'en',
      lastname: 'Doe',
      name: 'John Doe',
      number: '202000000001',
      password_updated_at: '2020-05-08T12:25:04.021Z',
      session_token: 'dummy-session-token',
      slug: 'john-doe',
      status: 'active',
      updated_at: '2020-05-08T12:25:04.021Z',
    };
    /* eslint-enable @typescript-eslint/camelcase */

    it('posts the email and password to /customers/login', async () => {
      mockRequest.mockImplementationOnce(
        async (
          method: RequestMethod,
          path: string,
          options: RequestOptions,
          body?: RequestInit['body']
        ) => {
          expect(method).toBe(RequestMethod.POST);
          expect(path).toBe('/customers/login');
          expect(body).toBe(JSON.stringify({ username: 'user@example.com', password: 'dummy' }));
          return new Response(JSON.stringify(DUMMY_LOGIN_RESPONSE));
        }
      );

      expect.assertions(3);
      await client.login('user@example.com', 'dummy');
    });

    it('uses the session token in subsequent requests', async () => {
      mockRequest
        .mockReturnValueOnce(Promise.resolve(new Response(JSON.stringify(DUMMY_LOGIN_RESPONSE))))
        .mockImplementationOnce(
          async (method: RequestMethod, path: string, options: RequestOptions) => {
            expect(options.sessionToken).toBe(DUMMY_LOGIN_RESPONSE.session_token);
            return new Response(JSON.stringify({}));
          }
        );

      expect.assertions(1);
      await client.login('user@example.com', 'dummy');
      client.get('/');
    });

    it('returns the current customer', async () => {
      mockRequest.mockReturnValueOnce(
        Promise.resolve(new Response(JSON.stringify(DUMMY_LOGIN_RESPONSE)))
      );

      expect(client.login('user@example.com', 'dummy')).resolves.toMatchObject(
        DUMMY_LOGIN_RESPONSE
      );
    });
  });

  describe('validateSession', () => {
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

    it('uses the session token to request /customers/me', async () => {
      mockRequest.mockImplementationOnce(
        async (method: RequestMethod, path: string, options: RequestOptions) => {
          expect(method).toBe(RequestMethod.GET);
          expect(path).toBe('/customers/me');
          expect(options.sessionToken).toBe('dummy-session-token');
          return new Response(JSON.stringify(DUMMY_CUSTOMERS_ME_RESPONSE));
        }
      );

      expect.assertions(3);
      await client.validateSession('dummy-session-token');
    });

    it('uses the session token in subsequent requests', async () => {
      mockRequest
        .mockReturnValueOnce(
          Promise.resolve(new Response(JSON.stringify(DUMMY_CUSTOMERS_ME_RESPONSE)))
        )
        .mockImplementationOnce(
          async (method: RequestMethod, path: string, options: RequestOptions) => {
            expect(options.sessionToken).toBe('dummy-session-token');
            return new Response(JSON.stringify({}));
          }
        );

      expect.assertions(1);
      await client.validateSession('dummy-session-token');
      client.get('/');
    });

    it('returns the customer', () => {
      mockRequest.mockReturnValueOnce(
        Promise.resolve(new Response(JSON.stringify(DUMMY_CUSTOMERS_ME_RESPONSE)))
      );

      expect(client.validateSession('dummy-session-token')).resolves.toMatchObject(
        DUMMY_CUSTOMERS_ME_RESPONSE
      );
    });

    it('return undefined for an invalid session', () => {
      mockRequest.mockReturnValueOnce(Promise.resolve(new Response('', { status: 401 })));

      expect(client.validateSession('wrong-session-token')).resolves.toBe(undefined);
    });

    it('throws an error on other errors', () => {
      mockRequest.mockReturnValueOnce(Promise.resolve(new Response('', { status: 500 })));

      expect(client.validateSession('dummy-session-token')).rejects.toThrowError(
        'Internal Server Error (500)'
      );
    });
  });
});
