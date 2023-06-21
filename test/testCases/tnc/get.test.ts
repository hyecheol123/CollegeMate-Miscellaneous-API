/**
 * Jest Unit Test for GET /tnc method
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import * as Cosmos from '@azure/cosmos';

describe('GET /tnc - Get Terms and Condition', () => {
  let testEnv: TestEnv;

  beforeEach(async () => {
    // Setup test environment
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();
  });

  afterEach(async () => await testEnv.stop());

  test('Fail - Request not from collegemate.app nor Mobile Application', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request - Without Origin Header and applicationKey Header
    let response = await request(testEnv.expressServer.app).get('/tnc');
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request - With wrong Origin Header
    response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({Origin: 'https://suspicious.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request - With wrong applicationKey Header
    response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({'X-APPLICATION-KEY': '<Suspicious-App>'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success - Request from API-Server', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request from API-Server
    const response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({'X-APPLICATION-KEY': '<API-Servers>'});
    expect(response.status).toBe(200);
    expect(response.body.version).toBe('v2.0.0');
    const createdAt = new Date(response.body.createdAt);
    expect(createdAt.getFullYear()).toBe(2023);
    expect(createdAt.getMonth()).toBe(2);
    expect(createdAt.getDate()).toBe(12);
    expect(response.body.content).toBe('Terms and Condition');
  });

  test('Success - Request from collegemate.app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request from Application
    const response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.version).toBe('v2.0.0');
    const createdAt = new Date(response.body.createdAt);
    expect(createdAt.getFullYear()).toBe(2023);
    expect(createdAt.getMonth()).toBe(2);
    expect(createdAt.getDate()).toBe(12);
    expect(response.body.content).toBe('Terms and Condition');
  });

  test('Success - Request from Application', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request from Application
    const response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.version).toBe('v2.0.0');
    const createdAt = new Date(response.body.createdAt);
    expect(createdAt.getFullYear()).toBe(2023);
    expect(createdAt.getMonth()).toBe(2);
    expect(createdAt.getDate()).toBe(12);
    expect(response.body.content).toBe('Terms and Condition');
  });

  test('Fail - No public terms and condition', async () => {
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Remove all public terms and condition from DB
    await testEnv.dbClient
      .container('termsAndCondition')
      .item('v2.0.0')
      .delete();
    await testEnv.dbClient
      .container('termsAndCondition')
      .item('v1.0.0')
      .delete();

    // Request - From web
    let response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    // Request - From app
    response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Fail - No terms and condition', async () => {
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Remove all terms and condition from DB
    await testEnv.dbClient
      .container('termsAndCondition')
      .item('v2.0.0')
      .delete();
    await testEnv.dbClient
      .container('termsAndCondition')
      .item('v2.0.1')
      .delete();
    await testEnv.dbClient
      .container('termsAndCondition')
      .item('v1.0.0')
      .delete();
    await testEnv.dbClient
      .container('termsAndCondition')
      .item('v1.0.2')
      .delete();

    // Request - From web
    let response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');

    // Request - From app
    response = await request(testEnv.expressServer.app)
      .get('/tnc')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });
});
