import awscred from 'awscred';
import AWS from 'aws-sdk';

const region = 'us-west-2';
AWS.config.region = region;
const SSM = new AWS.SSM(); // Read paramters from EC2 paramter store

let isInitialized = false;

const getParameters = async keys => {
  const prefix = '/kairoscope/dev/';
  const req = { Names: keys.map(key => `${prefix}${key}`) };
  const resp = await SSM.getParameters(req).promise();
  const params = {};
  resp.Parameters.forEach(param => { params[param.Name.substr(prefix.length)] = param.Value; });
  return params;
};

const init = () => new Promise(async (resolve, reject) => {
  if (isInitialized) resolve();
  const params = await getParameters([
    'db-host',
    'db-name',
    'jwt-name',
    'jwt-secret',
    'jwt-name',
    'readings-collection-name',
    'hexagrams-collection-name',
  ]);
  process.env.STAGE = 'dev';
  process.env.AWS_REGION = region;
  process.env['db-host'] = params['db-host'];
  process.env['db-name'] = params['db-name'];
  process.env.jwtName = params['jwt-name'];
  process.env['jwt-secret'] = params['jwt-secret'];
  process.env.readingCollectionName = params['readings-collection-name'];
  process.env.hexagramCollectionName = params['hexagrams-collection-name'];
  process.env.jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc0F1dGgiOnRydWUsInJvbGUiOjIsIl9pZCI6IjU5ZGU5ZTUwMjM1NDNmOGEyOGNmYzA3MSIsImlhdCI6MTU0NTc2NjQ0MH0.ZJ9nXFbfuYo73SQAGal_NYi9aeAwNfR_X45527VAopc';

  // User the awscred library to load credantial keys from the local profile.
  awscred.loadCredentials((err, data) => {
    if (err) reject(err);
    process.env.AWS_ACCESS_KEY_ID = data.accessKeyId;
    process.env.AWS_SECRET_ACCESS_KEY = data.secretAccessKey;
    // This is for the CodePipeline.
    // When we run the code there, a temporary IAM role will be used. So we have to add it as the session token.
    if (data.sessionToken) process.env.AWS_SESSION_TOKEN = data.sessionToken;
    isInitialized = true;
    resolve();
  });
});
export default init;
