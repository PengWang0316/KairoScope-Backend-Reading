import { invokeCreateReading } from '../helpers/InvokeHelper';
import { initialConnects, getDB, promiseReturnResult } from '../../libs/MongoDBHelper';
import initEvns from '../helpers/InitialEnvs';

let context;
const userId = '59de9e5023543f8a28aaaaab'; // This is a customized key that is only used by this test case to prevent the conflict with other tests that is running parallelly .

const removeReading = () => getDB()
  .collection(process.env.readingCollectionName).deleteOne({ user_id: userId });

describe('create-reading: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
    await initialConnects(context.dbUrl, context.dbName);
  });

  // Delete the reading after the test finished
  afterAll(async () => {
    await removeReading();
  });

  test('invoke create-reading function', async () => {
    const event = {
      // A fake jwt message is using for testing
      body: '{ "reading":{"reading_name":"Temp Reading","hexagram_arr_1":"6,8-7,9-6,8-6,8-7,9-7,9","hexagram_arr_2":"6,8-7,9-7,9-6,8-7,9-6,8","img1":"8,7,6,8,7,9","img2":"8,7,7,8,7,8","date":"2019-01-04T23:24:34.000Z","change_lines":["2","5"],"change_lines_text":"3rd,6th","people":"","userName":"Kevin Wang"}, "jwtMessage": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWRlOWU1MDIzNTQzZjhhMjhhYWFhYWIiLCJpYXQiOjF9.MTc8lyR4mTJCrYI1nY5odLVOGoPRZ8Dtuqmy0pOgF6s" }',
    };

    await invokeCreateReading(event, context);

    const result = await promiseReturnResult(db => db.collection(process.env.readingCollectionName).countDocuments({ user_id: userId }));
    expect(result).toBe(1);
  });
});
