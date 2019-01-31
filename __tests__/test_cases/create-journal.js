import { ObjectId } from 'mongodb';
import {
  initialConnects, getDB, promiseReturnResult, promiseInsertResult,
} from '@kevinwang0316/mongodb-helper';

import { invokeCreateJournal } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;
const userId = '59de9e5023543f8a28aaaaa1'; // This is a customized key that is only used by this test case to prevent the conflict with other tests that is running parallelly .
const readingId = new ObjectId().toString();

const addReading = () => promiseInsertResult(db => db
  .collection(process.env.readingCollectionName)
  .insertOne({ _id: new ObjectId(readingId), journal_entries: [], user_id: userId }));

const removeReading = () => getDB()
  .collection(process.env.readingCollectionName).deleteOne({ _id: new ObjectId(readingId) });

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
    await addReading();
  });

  // Delete the reading after the test finished
  afterAll(async () => {
    await removeReading();
  });

  test('invoke create-reading function', async () => {
    const event = {
      // A fake jwt message is using for testing
      body: `{ "journal":{"readings":{"${readingId}": "state"}}, "jwtMessage": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWRlOWU1MDIzNTQzZjhhMjhhYWFhYTEiLCJpYXQiOjF9.CSuq5ORx2oxMJZeNOqmsN6sVtb2krU850krqXBZpI_A" }`,
    };
    context.user = { _id: userId };
    await invokeCreateJournal(event, context);

    const result = await promiseReturnResult(db => db.collection(process.env.readingCollectionName).findOne({ _id: new ObjectId(readingId) }));
    expect(result.journal_entries.length).toBe(1);
    expect(result.journal_entries[0].user_id).toBe(context.user._id);
    expect(result.journal_entries[0].pingPongStates).toEqual({ [readingId]: 'state' });
  });
});
