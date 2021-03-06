import aws4 from 'aws4';
import axios from 'axios';
import URL from 'url'; // Come from node.js module


const APP_ROOT = '../../';
const isIntegrationTest = process.env.TEST_MODE === 'integration'; // Pass this from npm script to decide which kind of test will be run.

// The helper to sign the request and return headers
const signHttpRequest = (isIAM, realURL) => {
  if (!isIAM) return {};
  const url = URL.parse(realURL);
  const opts = {
    host: url.hostname,
    path: url.pathname,
  };
  aws4.sign(opts);

  const headers = {
    Host: opts.headers.Host,
    'X-Amz-Date': opts.headers['X-Amz-Date'],
    Authorization: opts.headers.Authorization,
    'X-Amz-Security-Token': opts.headers['X-Amz-Security-Token'],
  };
  // If 'X-Amz-Security-Token' does not exsit, delete it for the local test.
  if (!headers['X-Amz-Security-Token']) delete headers['X-Amz-Security-Token'];
  return headers;
};

// Invode the handler via a real api gateway to do the acceptance test
const viaHttp = async (path, opts = { iam: false }, method = 'get') => new Promise(async (resolve, reject) => {
  const url = `${process.env.TEST_ROOT}/${path}${opts.isJwt ? `&jwtMessage=${process.env.jwt}` : ''}`; // Add jwtMessage if requires
  console.log(`Invoking via HTTP ${url}`);
  const headers = signHttpRequest(opts.iam, url);
  if (opts.authHeader) headers.Authorization = opts.authHeader; // Set a Authorization header if function need a cognito user token
  const options = {
    method,
    url,
    data: opts.body,
    headers,
  };
  if (!opts.body) delete options.data;
  try {
    const result = await axios(options);
    resolve({
      headers: { ...result.headers, 'Content-Type': result.headers['content-type'] },
      body: result.data,
      statusCode: result.status,
    });
  } catch (err) {
    reject(err);
  }
});

// Invoke the handler locally to do the integration test
const viaHandler = (handlerName, event = {}, context = {}) => {
  const handler = require(`${APP_ROOT}/functions/${handlerName}`).handler;

  return new Promise((resolve, reject) => {
    const callback = (err, response) => {
      if (err) reject(err);
      else {
        const contentType = response.headers && response.headers['Content-Type'] ? response.headers['Content-Type'] : 'application/json';
        if (response.body && contentType === 'application/json') response.body = JSON.parse(response.body);
      }
      resolve(response);
    };
    handler(event, context, callback);
  });
};

const invokeFetchReadingsAmount = (event, context) => isIntegrationTest
  ? viaHandler('fetch-readings-amount', event, context)
  : viaHttp('readings/amount?', { iam: false, isJwt: true });

const invokeFetchReadings = (event, context) => isIntegrationTest
  ? viaHandler('fetch-readings', event, context)
  : viaHttp('readings?pageNumber=0&numberPerpage=5', { iam: false, isJwt: true });

const invokeSearchReadings = (event, context) => isIntegrationTest
  ? viaHandler('search-readings', event, context)
  : viaHttp('readings/search?searchCriterias=%7B"startDate":"","endDate":"","people":"","upperId":0,"lowerId":0,"line13Id":0,"line25Id":0,"line46Id":0%7D', { iam: false, isJwt: true });

const invokeFetchAllReadingList = (event, context) => isIntegrationTest
  ? viaHandler('fetch-all-reading-list', event, context)
  : viaHttp('readings/allList?pageNumber=1&numberPerpage=10', { iam: false, isJwt: true });

const invokeFetchReadingsByHexagramId = (event, context) => isIntegrationTest
  ? viaHandler('fetch-readings-by-hexagram-id', event, context)
  : viaHttp('readings/hexagram?imageArray=6,8-7,9-6,8-6,8-6,8-7,9', { iam: false, isJwt: true });

const invokeFetchJournals = (event, context) => isIntegrationTest
  ? viaHandler('fetch-journals', event, context)
  : viaHttp('journals?readingId=5a5ab536c4c2a907932b1f7c', { iam: false, isJwt: true });

const invokeFetchJournal = (event, context) => isIntegrationTest
  ? viaHandler('fetch-journal', event, context)
  : viaHttp(`journal?journalId=${event.queryStringParameters.journalId}`, { iam: false, isJwt: true });

const invokeFetchJournalByIds = (event, context) => isIntegrationTest
  ? viaHandler('fetch-journal-by-ids', event, context)
  : viaHttp('journals/byIds?readingId=5b5df01aa569a07d26359eee&journalId=5bf39beefb84fc0fa3e2632e', { iam: false, isJwt: true });

const invokeFetchReadingsByName = (event, context) => isIntegrationTest
  ? viaHandler('fetch-readings-by-name', event, context)
  : viaHttp('readings/search/name?keyWord=test', { iam: false, isJwt: true });

const invokeDeleteJournal = (event, context) => isIntegrationTest
  ? viaHandler('delete-journal', event, context)
  : viaHttp('journals/delete', { iam: false, isJwt: false, body: JSON.parse(event.body) }, 'put');

const invokeCreateReading = (event, context) => isIntegrationTest
  ? viaHandler('create-reading', event, context)
  : viaHttp('readings', { iam: false, isJwt: false, body: JSON.parse(event.body) }, 'post');

// A customized fake jwt message is used to isolate this test case from others
const invokeDeleteReading = (event, context) => isIntegrationTest
  ? viaHandler('delete-reading', event, context)
  : viaHttp(`readings?jwtMessage=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1OWRlOWU1MDIzNTQzZjhhMjhhYWFhYWEiLCJpYXQiOjF9.Mlxi9iFuyBqShIVRmJVkrc6cHyhFyJbRfO9zScGtzn0&readingId=${context.readingId}`, { iam: false, isJwt: false }, 'delete');

// A customized fake jwt message is used to isolate this test case from others
const invokeCreateJournal = (event, context) => isIntegrationTest
  ? viaHandler('create-journal', event, context)
  : viaHttp(`journal`, { iam: false, isJwt: false, body: JSON.parse(event.body) }, 'post');

// const invokeGetRestaurants = () => testMode === 'integration'
//   ? viaHandler('get-restaurants') : viaHttp('restaurants', 'get', { iam: true });

// const invokeSearchRestaurants = (theme, authHeader) => testMode === 'integration'
//   ? viaHandler('search-restaurants', { body: JSON.stringify({ theme }), authHeader })
//   : viaHttp('restaurants/search', 'post', { iam: false, body: { theme }, authHeader });

module.exports = {
  invokeFetchReadingsAmount,
  invokeFetchReadings,
  invokeSearchReadings,
  invokeFetchAllReadingList,
  invokeFetchReadingsByHexagramId,
  invokeFetchJournals,
  invokeFetchReadingsByName,
  invokeDeleteJournal,
  invokeDeleteReading,
  invokeFetchJournalByIds,
  invokeCreateReading,
  invokeFetchJournal,
  invokeCreateJournal,
};
