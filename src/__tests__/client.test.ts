import { request, RequestMethod } from '../request';
import { Client } from '../client';

jest.mock('../request');

const mockRequest = (request as unknown) as jest.Mock<typeof request>;

describe('get', () => {
  it('gets the correct value', async () => {
    const client = new Client('my token');
    const value = await client.get('/');

    expect(value).toMatchObject({ id: 'mocked' });
  });

  it('uses the correct method', async () => {
    const client = new Client('my token');
    await client.get('/');

    expect(mockRequest).toBeCalledWith(RequestMethod.GET, expect.anything(), expect.anything());
  });

  it('sets the token for the request', async () => {
    const client = new Client('my token');
    await client.get('/');

    expect(mockRequest).toBeCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ token: 'my token' })
    );
  });

  it('passed the correct path', async () => {
    const client = new Client('my token');
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
});
