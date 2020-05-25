import { request, RequestMethod } from '../src/request';
import { Auth } from '../src/auth';

jest.mock('../src/request');
jest.mock('../src/storage', function() {
  return {
    sessionStorage: {
      setItem: jest.fn(),
      getItem: jest.fn(() => null),
      removeItem: jest.fn(),
    },
    persistentStorage: {
      setItem: jest.fn(),
      getItem: jest.fn(() => null),
      removeItem: jest.fn(),
    },
  };
});

const mockRequest = (request as unknown) as jest.Mock<
  ReturnType<typeof request>,
  Parameters<typeof request>
>;

mockRequest.mockImplementation(async () => {
  return new Response(
    /* eslint-disable @typescript-eslint/camelcase */
    JSON.stringify({
      access_token: 'mocked_access_token',
      expires_in: 1800,
      refresh_token: 'mocked_refresh_token',
    })
    /* eslint-enable @typescript-eslint/camelcase */
  );
});

// TODO: add tests for interaction with storage, negative scenarios and handling of optional scopes

describe('Auth', () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  describe('ensureFresh', () => {
    it('exchanges the refresh token for an access token', async () => {
      const auth = new Auth('my client id', { refreshToken: 'dummy-refresh-token' });
      await expect(auth.ensureFresh()).resolves.toBe('mocked_access_token');
    });

    it('throws an error when there is no refresh token', async () => {
      const auth = new Auth('my client id');
      await expect(auth.ensureFresh()).rejects.toThrowError('No refresh token available');
    });

    it('it refreshes the access token only when necessary', async () => {
      const auth = new Auth('my client id', { refreshToken: 'dummy-refresh-token' });
      await expect(auth.ensureFresh()).resolves.toBe('mocked_access_token');
      await expect(auth.ensureFresh()).resolves.toBe('mocked_access_token');
      expect(mockRequest).toBeCalledTimes(1);
    });
  });

  describe('login', () => {
    it('uses the username and password in a ROPC flow', async () => {
      const auth = new Auth('my client id');
      await expect(auth.login('user@example.com', 'dummy')).resolves.toBe(true);
      expect(mockRequest).toBeCalledWith(
        RequestMethod.POST,
        '/oauth2/tokens',
        expect.anything(),
        expect.any(FormData)
      );
      const body = mockRequest.mock.calls[0][3] as FormData;
      expect(body.get('grant_type')).toBe('password');
      expect(body.get('username')).toBe('user@example.com');
      expect(body.get('password')).toBe('dummy');
    });
  });
});
