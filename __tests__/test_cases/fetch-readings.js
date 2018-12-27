import { invokeFetchReadings } from '../helpers/InvokeHelper';
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
    const event = {
      queryStringParameters: {
        jwtMessage: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc0F1dGgiOnRydWUsInJvbGUiOjIsIl9pZCI6IjU5ZGU5ZTUwMjM1NDNmOGEyOGNmYzA3MSIsImlhdCI6MTU0NTc2NjQ0MH0.ZJ9nXFbfuYo73SQAGal_NYi9aeAwNfR_X45527VAopc',
        pageNumber: '0',
        numberPerpage: '5',
      },
    };
    const res = await invokeFetchReadings(event, context);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(5);
    res.body.forEach(reading => {
      expect(Object.prototype.hasOwnProperty.call(reading, '_id')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'reading_name')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'hexagram_arr_1')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'hexagram_arr_2')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'img1')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'img2')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'date')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'change_lines')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'change_lines_text')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'people')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'userName')).toBe(true);
      expect(Object.prototype.hasOwnProperty.call(reading, 'user_id')).toBe(true);
    });
  });
});
