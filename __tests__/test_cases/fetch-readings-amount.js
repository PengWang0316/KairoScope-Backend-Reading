import { invokeFetchReadingsAmount } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('fetch-readings-amount: invoke the Get / endpoint', () => {
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
    const event = { queryStringParameters: { jwtMessage: process.env.jwt } };
    const res = await invokeFetchReadingsAmount(event, context);

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe(21);
  });
});
