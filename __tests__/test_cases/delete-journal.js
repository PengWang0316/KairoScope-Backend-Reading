import { ObjectId } from 'mongodb';
import { initialConnects, promiseInsertResult, promiseFindResult } from '@kevinwang0316/mongodb-helper';

import { invokeDeleteJournal } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;
let journalId;
const readingId = '5b5df01aa569a07d26359eee';

const addOneJournal = () => promiseInsertResult(db => {
  const internalJournal = {}; // Using a copy to work.
  internalJournal.date = new Date(internalJournal.date);
  internalJournal._id = new ObjectId();
  journalId = internalJournal._id.toString();

  // let readings = Object.assign({}, journal.readings);
  internalJournal.pingPongStates = internalJournal.readings; // Changing the name to poingPongStates
  delete internalJournal.readings;
  return db.collection(process.env.readingCollectionName).update({ _id: new ObjectId(readingId) }, {
    $push: { journal_entries: internalJournal },
  });
});

describe('delete-journal: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
    await initialConnects(context.dbUrl, context.dbName);
    await addOneJournal(); // Add one journal to the reading
  });

  test('invoke delete-journal function', async () => {
    const event = {
      // queryStringParameters: {
      //   jwtMessage: process.env.jwt,
      // },
      body: `{ "readingIds": ["${readingId}"], "journalId": "${journalId}", "jwtMessage": "${process.env.jwt}" }`,
    };

    const beforeResult = await promiseFindResult(db => db.collection(process.env.readingCollectionName).find({ _id: new ObjectId(readingId) }, { projection: { journal_entries: 1 } }));
    expect(beforeResult[0].journal_entries.length).toBe(2);

    await invokeDeleteJournal(event, context);

    const afterResult = await promiseFindResult(db => db.collection(process.env.readingCollectionName).find({ _id: new ObjectId(readingId) }, { projection: { journal_entries: 1 } }));
    expect(afterResult[0].journal_entries.length).toBe(1);
  });
});
