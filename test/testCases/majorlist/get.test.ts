/**
 * Jest Unit Test for GET /majorlist method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';

describe('GET /majorlist - Get Major List', () => {
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
    let response = await request(testEnv.expressServer.app).get('/majorlist');
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request - With wrong Origin Header
    response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({ Origin: 'https://suspicious.com' });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request - With wrong applicationKey Header
    response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({ 'X-APPLICATION-KEY': '<Suspicious-App>' });
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Request without body', async () => {
    fail();
  });

  test('Fail - Request with additional properties', async () => {
    fail();
  });

  test('Fail - Request with not existing school property', async () => {
    fail();
  });

  test('Success - Request from collegemate.app', async () => {
    fail();
  });

  test('Success - Request from Application', async () => {
    fail();
  });
});
