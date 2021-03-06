import { invokeFetchReadings } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('fetch-readings: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
  });

  test('invoke fetch-readings function', async () => {
    const event = {
      queryStringParameters: {
        jwtMessage: process.env.jwt,
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
