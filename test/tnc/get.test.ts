/**
 * Jest Unit Test for GET /tnc method
 * 
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import TestEnv from '../TestEnv';
import ExpressServer from '../../src/ExpressServer';
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
    response = await request(testEnv.expressServer.app).get('/tnc').set({ Origin: 'https://suspicious.com' });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request - With wrong applicationKey Header
    response = await request(testEnv.expressServer.app).get('/tnc').set({ "X-APPLICATION-KEY": '<Suspicious-App>' });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success - Request from collegemate.app', async () => {
    // TODO
    fail();
  });

  test('Success - Request from Application', async () => {
    // TODO
    fail();
  });

  test('Fail - No public terms and condition', async () => {
    // TODO
    fail();
  });

  test('Fail - No terms and condition', async () => {
    // TODO
    fail();
  });
});