import { invokeSearchReadings } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('search-readings: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
  });

  test('invoke search-readings function', async () => {
    const event = {
      queryStringParameters: {
        jwtMessage: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc0F1dGgiOnRydWUsInJvbGUiOjIsIl9pZCI6IjU5ZGU5ZTUwMjM1NDNmOGEyOGNmYzA3MSIsImlhdCI6MTU0NTc2NjQ0MH0.ZJ9nXFbfuYo73SQAGal_NYi9aeAwNfR_X45527VAopc',
        // searchCriterias: '%7B%22startDate%22:%22%22,%22endDate%22:%22%22,%22people%22:%22%22,%22upperId%22:0,%22lowerId%22:0,%22line13Id%22:0,%22line25Id%22:0,%22line46Id%22:0%7D',
        searchCriterias: '{"startDate":"","endDate":"","people":"","upperId":0,"lowerId":0,"line13Id":0,"line25Id":0,"line46Id":0}',
      },
    };
    const res = await invokeSearchReadings(event, context);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(21);
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
