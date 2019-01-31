
import { ObjectId } from 'mongodb';
import { initialConnects, promiseInsertResult, promiseReturnResult } from '@kevinwang0316/mongodb-helper';

import { invokeDeleteReading } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;
let readingId;
const userId = '59de9e5023543f8a28aaaaaa'; // This is a customized key that is only used by this test case to prevent the conflict with other tests that is running parallelly .

const addOneReading = () => promiseInsertResult(db => {
  const internalReading = { _id: new ObjectId(), user_id: userId }; // Using a copy to work.
  readingId = internalReading._id.toString();

  return db.collection(process.env.readingCollectionName).insertOne(internalReading);
});

describe('delete-reading: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
    await initialConnects(context.dbUrl, context.dbName);
    await addOneReading(); // Add one reading to the test user
  });

  test('invoke delete-reading function', async () => {
    const event = {
      queryStringParameters: {
        // This is a fake message just for this test case
        jwtMessage: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWRlOWU1MDIzNTQzZjhhMjhhYWFhYWEiLCJpYXQiOjF9.Mlxi9iFuyBqShIVRmJVkrc6cHyhFyJbRfO9zScGtzn0',
        readingId,
      },
    };

    const beforeResult = await promiseReturnResult(db => db.collection(process.env.readingCollectionName).countDocuments({ _id: new ObjectId(readingId) }));
    expect(beforeResult).toBe(1);

    context.readingId = readingId; // Put the reading id in the context to be used with http call
    await invokeDeleteReading(event, context);

    const afterResult = await promiseReturnResult(db => db.collection(process.env.readingCollectionName).countDocuments({ _id: new ObjectId(readingId) }));
    expect(afterResult).toBe(0);
  });
});
