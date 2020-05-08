export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

export const request = jest.fn(() => {
  return new Response(
    JSON.stringify({
      id: 'mocked',
    })
  );
});
