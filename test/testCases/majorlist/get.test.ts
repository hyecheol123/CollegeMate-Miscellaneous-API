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
      .set({Origin: 'https://suspicious.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request - With wrong applicationKey Header
    response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({'X-APPLICATION-KEY': '<Suspicious-App>'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Request without body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Request with additional properties', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({Origin: 'https://collegemate.app'})
      .send({schoolDomain: 'wisc.edu', additionalProperty: 'additional'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Request without required properties', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({Origin: 'https://collegemate.app'})
      .send({schoolDomainAbc: 'wisc.edu'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - Request with not existing school property', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({Origin: 'https://collegemate.app'})
      .send({schoolDomain: 'suspiciouscollege.edu'});
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Not Found');
  });

  test('Success - Request from collegemate.app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    let response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({Origin: 'https://collegemate.app'})
      .send({schoolDomain: 'wisc.edu'});
    expect(response.status).toBe(200);
    expect(response.body.majorList.length).toBe(4);
    expect(response.body.majorList[0]).toBe('Animal Science');
    expect(response.body.majorList[1]).toBe('Computer Science');
    expect(response.body.majorList[2]).toBe('ECE');
    expect(response.body.majorList[3]).toBe('Physics');

    response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({Origin: 'https://collegemate.app'})
      .send({schoolDomain: 'uw.edu'});
    expect(response.status).toBe(200);
    expect(response.body.majorList.length).toBe(3);
    expect(response.body.majorList[0]).toBe('Computer Science');
    expect(response.body.majorList[1]).toBe('ECE');
    expect(response.body.majorList[2]).toBe('Math');

    response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({Origin: 'https://collegemate.app'})
      .send({schoolDomain: 'liberty.edu'});
    expect(response.status).toBe(200);
    expect(response.body.majorList.length).toBe(4);
    expect(response.body.majorList[0]).toBe('Computer Science');
    expect(response.body.majorList[1]).toBe('ECE');
    expect(response.body.majorList[2]).toBe('Math');
    expect(response.body.majorList[3]).toBe('Physics');
  });

  test('Success - Request from Application', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    let response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({schoolDomain: 'wisc.edu'});
    expect(response.status).toBe(200);
    expect(response.body.majorList.length).toBe(4);
    expect(response.body.majorList[0]).toBe('Animal Science');
    expect(response.body.majorList[1]).toBe('Computer Science');
    expect(response.body.majorList[2]).toBe('ECE');
    expect(response.body.majorList[3]).toBe('Physics');

    response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({schoolDomain: 'uw.edu'});
    expect(response.status).toBe(200);
    expect(response.body.majorList.length).toBe(3);
    expect(response.body.majorList[0]).toBe('Computer Science');
    expect(response.body.majorList[1]).toBe('ECE');
    expect(response.body.majorList[2]).toBe('Math');

    response = await request(testEnv.expressServer.app)
      .get('/majorlist')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'})
      .send({schoolDomain: 'liberty.edu'});
    expect(response.status).toBe(200);
    expect(response.body.majorList.length).toBe(4);
    expect(response.body.majorList[0]).toBe('Computer Science');
    expect(response.body.majorList[1]).toBe('ECE');
    expect(response.body.majorList[2]).toBe('Math');
    expect(response.body.majorList[3]).toBe('Physics');
  });
});
