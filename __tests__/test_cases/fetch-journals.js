import { invokeFetchJournals } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('fetch-journals: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
  });

  test('invoke fetch-journals function', async () => {
    const event = {
      queryStringParameters: {
        jwtMessage: process.env.jwt,
        readingId: '5a5ab536c4c2a907932b1f7c',
      },
    };
    const res = await invokeFetchJournals(event, context);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].user_id).toBe('59de9e5023543f8a28cfc071');
    expect(res.body[0]._id).toBe('5a650627beabf5005c6cc6ff');
    expect(res.body[0].shareList).toEqual([]);
    expect(Object.keys(res.body[0]).length).toBe(10);
  });
});
