import { request, RequestMethod } from '../request';
import { Client } from '../client';

jest.mock('../request');

const mockRequest = (request as unknown) as jest.Mock<typeof request>;

describe('Client', () => {
  beforeEach(() => {
    mockRequest.mockClear();
  });

  const client = new Client('my token');
  it('gets the correct value', async () => {
    const value = await client.get('/');

    expect(value).toMatchObject({ id: 'mocked' });
  });

  it('sets the token for the request', async () => {
    await client.get('/');

    expect(mockRequest).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ token: 'my token' })
    );
  });

  it('passed the correct path', async () => {
    await client.get('/');

    expect(mockRequest).toBeCalledWith(expect.anything(), '/', expect.anything());
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
      })
    );
  });

  describe('get', () => {
    it('uses the correct method', async () => {
      await client.get('/');

      expect(mockRequest).toBeCalledWith(RequestMethod.GET, expect.anything(), expect.anything());
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

      expect(mockRequest).toBeCalledWith(expect.anything(), expect.anything(), expect.anything(), {
        foo: 'bar',
      });
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

      expect(mockRequest).toBeCalledWith(expect.anything(), expect.anything(), expect.anything(), {
        foo: 'bar',
      });
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

      expect(mockRequest).toBeCalledWith(expect.anything(), expect.anything(), expect.anything(), {
        foo: 'bar',
      });
    });
  });

  describe('delete', () => {
    const client = new Client('my token');

    it('uses the correct method', async () => {
      await client.delete('/');

      expect(mockRequest).toBeCalledWith(
        RequestMethod.DELETE,
        expect.anything(),
        expect.anything()
      );
    });
  });
});
