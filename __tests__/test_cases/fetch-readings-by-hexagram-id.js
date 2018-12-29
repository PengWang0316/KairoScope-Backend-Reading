import { invokeFetchReadingsByHexagramId } from '../helpers/InvokeHelper';
import initEvns from '../helpers/InitialEnvs';

let context;

describe('fetch-readings-by-hexagram-id: invoke the Get / endpoint', () => {
  beforeAll(async () => {
    jest.setTimeout(10000); // Setup a longer timeout to allow CodeBuild fetch the credantial keys from ECS.
    await initEvns();
    context = {
      dbUrl: process.env['db-host'],
      dbName: process.env['db-name'],
      jwtSecret: process.env['jwt-secret'],
    };
  });

  test('invoke fetch-readings-by-hexagram-id function', async () => {
    const event = {
      queryStringParameters: {
        jwtMessage: process.env.jwt,
        imageArray: '6,8-7,9-6,8-6,8-6,8-7,9',
      },
    };
    const res = await invokeFetchReadingsByHexagramId(event, context);

    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], '_id')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'reading_name')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'hexagram_arr_1')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'hexagram_arr_2')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'img1')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'img2')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'date')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'change_lines')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'change_lines_text')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'people')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'userName')).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(res.body[0], 'user_id')).toBe(true);
  });
});
