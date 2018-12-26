import { invokeFetchReadingsAmount } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('get-index: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
  });

  test('invoke fetch-readings-amount function', async () => {
    const event = { queryStringParameters: { jwtMessage: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc0F1dGgiOnRydWUsInJvbGUiOjIsIl9pZCI6IjU5ZGU5ZTUwMjM1NDNmOGEyOGNmYzA3MSIsImlhdCI6MTU0NTc2NjQ0MH0.ZJ9nXFbfuYo73SQAGal_NYi9aeAwNfR_X45527VAopc' } };
    const res = await invokeFetchReadingsAmount(event, context);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(21);
  });
});
