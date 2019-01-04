import { invokeFetchJournalByIds } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('fetch-journal-by-ids: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
  });

  test('invoke fetch-journal-by-ids function', async () => {
    const event = {
      queryStringParameters: {
        jwtMessage: process.env.jwt,
        readingId: '5b5df01aa569a07d26359eee',
        journalId: '5bf39beefb84fc0fa3e2632e',
      },
    };
    const res = await invokeFetchJournalByIds(event, context);
    // console.log(res);
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toBeUndefined();
    expect(res.body.user_id).toBe('59de9e5023543f8a28cfc071');
    expect(res.body._id).toBe('5bf39beefb84fc0fa3e2632e');
    expect(res.body.shareList).toEqual([]);
    expect(Object.keys(res.body).length).toBe(8);
  });
});
