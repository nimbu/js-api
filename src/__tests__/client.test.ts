import { request, RequestMethod, RequestOptions } from '../request';
import { Client } from '../client';

jest.mock('../request');

const mockRequest = (request as unknown) as jest.Mock<
  ReturnType<typeof request>,
  Parameters<typeof request>
>;

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
      mockRequest.mockImplementationOnce(async () => {
        return new Response('', {
          status: 401,
          statusText: 'Unauthorized',
        });
      });
      await expect(client.request(RequestMethod.GET, '/')).rejects.toThrowError(
        'Unauthorized (401)'
      );
    });

    it('returns an empty respons on 204', async () => {
      mockRequest.mockImplementationOnce(async () => {
        return new Response('', {
          status: 204,
        });
      });

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
        .mockImplementationOnce(async () => {
          return new Response(JSON.stringify(DUMMY_LOGIN_RESPONSE));
        })
        .mockImplementationOnce(
          async (
            method: RequestMethod,
            path: string,
            options: RequestOptions,
            body?: RequestInit['body']
          ) => {
            expect(options.sessionToken).toBe(DUMMY_LOGIN_RESPONSE.session_token);
            return new Response(JSON.stringify({}));
          }
        );

      expect.assertions(1);
      await client.login('user@example.com', 'dummy');
      client.get('/');
    });
  });
});
