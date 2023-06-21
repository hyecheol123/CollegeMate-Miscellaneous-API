/**
 * Jest Unit Test for POST /majorlist method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import createServerAdminToken from '../../../src/functions/JWT/createServerAdminToken';
import AuthToken from '../../../src/datatypes/Token/AuthToken';
import * as jwt from 'jsonwebtoken';
import TestConfig from '../../TestConfig';
import MajorList from '../../../src/datatypes/majorList/MajorList';

describe('POST /majorlist - Update Major List', () => {
  let testEnv: TestEnv;

  beforeEach(async () => {
    // Setup test environment
    testEnv = new TestEnv(expect.getState().currentTestName as string);

    // Start Test Environment
    await testEnv.start();
  });

  afterEach(async () => {
    await testEnv.stop();
  });

  test('Fail - No ServerToken', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    // Request with no serverToken
    const response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .send({forceUpdate: true});
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthenticated');
  });

  test('Fail - Invalid ServerToken', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const tokenContent: AuthToken = {
      id: 'test',
      type: 'refresh',
      tokenType: 'serverAdmin',
      accountType: 'admin',
    };
    // Generate AccessToken
    let testToken = jwt.sign(tokenContent, testEnv.testConfig.jwt.secretKey, {
      algorithm: 'HS512',
      expiresIn: '60m',
    });

    // Request with invalid serverToken
    let response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': testToken,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with wrong serverToken
    response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': 'test',
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request with serverToken - invalid accountType
    const wrongToken = {
      id: 'test',
      type: 'access',
      tokenType: 'serverAdmin',
      accountType: 'random',
    };
    // Generate AccessToken
    testToken = jwt.sign(wrongToken, testEnv.testConfig.jwt.secretKey, {
      algorithm: 'HS512',
      expiresIn: '60m',
    });
    response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': testToken,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Fail - Request with wrong body', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const serverAdminToken = createServerAdminToken(
      'test',
      'admin',
      testEnv.testConfig.jwt.secretKey
    );

    // Request with no body
    let response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      });
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with additional body
    response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({forceUpdate: true, test: 'test'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');

    // Request with only additional body
    response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({test: 'test'});
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Bad Request');
  });

  test('Fail - No ForceUpdate and Has not passed 5 days', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const serverAdminToken = createServerAdminToken(
      'test',
      'admin',
      testEnv.testConfig.jwt.secretKey
    );

    // Create majorList in the database that has not passed 5 days
    const id = 'wisc.edu';
    const lastChecked = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const major = ['Computer Science', 'Chemistry'].sort();
    const majorList = new MajorList(
      'wisc.edu',
      TestConfig.hash(id, id, JSON.stringify(major)),
      lastChecked,
      major
    );
    await testEnv.dbClient.container('majorList').items.create(majorList);

    // Request with no forceUpdate
    const response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({forceUpdate: false});
    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Conflict');

    // Check if the majorList is not updated
    const dbOps = await testEnv.dbClient
      .container('majorList')
      .item('wisc.edu')
      .read();
    expect(dbOps.resource.major).toEqual(major);
    expect(dbOps.resource.lastChecked).toEqual(lastChecked.toISOString());
  });

  test('Success - Multiple Schools', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const serverAdminToken = createServerAdminToken(
      'test',
      'admin',
      testEnv.testConfig.jwt.secretKey
    );

    // Create multiple majorList in the database to see if wisc.edu is updated
    let id = 'wisc.edu';
    const lastChecked = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    let major = ['Computer Science', 'Chemistry'].sort();
    let majorList = new MajorList(
      'wisc.edu',
      TestConfig.hash(id, id, JSON.stringify(major)),
      lastChecked,
      major
    );
    await testEnv.dbClient.container('majorList').items.create(majorList);
    id = 'ucla.edu';
    major = ['Animal Science', 'Geometry'].sort();
    majorList = new MajorList(
      'ucla.edu',
      TestConfig.hash(id, id, JSON.stringify(major)),
      lastChecked,
      major
    );
    await testEnv.dbClient.container('majorList').items.create(majorList);

    // Request with forceUpdate
    const response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(202);

    // Wait 100ms for mocking
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check if wisc.edu is updated
    let dbOps = await testEnv.dbClient
      .container('majorList')
      .item('wisc.edu')
      .read();
    expect(dbOps.resource.major.length).toBeGreaterThan(0);
    expect(dbOps.resource.lastChecked).not.toBe(lastChecked.toISOString());

    // Check if ucla.edu is not updated
    dbOps = await testEnv.dbClient
      .container('majorList')
      .item('ucla.edu')
      .read();
    expect(dbOps.resource.major.length).toBeGreaterThan(0);
    expect(dbOps.resource.lastChecked).toBe(lastChecked.toISOString());
  });

  test('Success - No Change', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const serverAdminToken = createServerAdminToken(
      'test',
      'admin',
      testEnv.testConfig.jwt.secretKey
    );

    // Create majorList in the database for test
    const id = 'wisc.edu';
    // more than 5 days ago
    const lastChecked = new Date();
    const major = [
      'Computer Science',
      'Chemistry',
      'Physics',
      'Mathematics',
      'Biology',
      'Economics',
      'Psychology',
      'English',
      'History',
      'Sociology',
    ].sort();
    const majorList = new MajorList(
      'wisc.edu',
      TestConfig.hash(id, id, JSON.stringify(major)),
      lastChecked,
      major
    );
    await testEnv.dbClient.container('majorList').items.create(majorList);

    // Request (forceUpdate already tested so just test with true)
    const response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(202);

    // Wait for 100 ms for mocking
    await new Promise(resolve => setTimeout(resolve, 100));

    // check if major list stayed the same in the database
    const dbOps = await testEnv.dbClient
      .container('majorList')
      .item('wisc.edu')
      .read();
    expect(dbOps.resource.major.length).toBeGreaterThan(0);
    expect(dbOps.resource.lastChecked).toBe(lastChecked.toISOString());
  });

  test('Success - Nothing in Database', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const serverAdminToken = createServerAdminToken(
      'test',
      'admin',
      testEnv.testConfig.jwt.secretKey
    );

    // Request with forceUpdate = false
    const response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({forceUpdate: false});
    expect(response.status).toBe(202);

    // Wait for 100 ms for mocking
    await new Promise(resolve => setTimeout(resolve, 100));

    // check if major list stayed the same in the database
    const dbOps = await testEnv.dbClient
      .container('majorList')
      .item('wisc.edu')
      .read();
    expect(dbOps.resource.major.length).toBeGreaterThan(0);
    expect(dbOps.resource.major).toContain('Computer Science');
    expect(dbOps.resource.major).toContain('Chemistry');
    expect(dbOps.resource.major).toContain('Physics');
    expect(dbOps.resource.major).toContain('Physics');
    expect(dbOps.resource.major).toContain('Mathematics');
    expect(dbOps.resource.major).toContain('Biology');
    expect(dbOps.resource.major).toContain('Economics');
    expect(dbOps.resource.major).toContain('Psychology');
    expect(dbOps.resource.major).toContain('English');
    expect(dbOps.resource.major).toContain('History');
    expect(dbOps.resource.major).toContain('Sociology');
    expect(dbOps.resource.id).toBe('wisc.edu');
  });

  test('Success - Without Forceupdate', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const serverAdminToken = createServerAdminToken(
      'test',
      'admin',
      testEnv.testConfig.jwt.secretKey
    );

    // Create majorList in the database for test
    const id = 'wisc.edu';
    // more than 5 days ago
    const lastChecked = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const major = [
      'Computer Science',
      'ECE',
      'Animal Science',
      'Physics',
    ].sort();
    const majorList = new MajorList(
      'wisc.edu',
      TestConfig.hash(id, id, JSON.stringify(major)),
      lastChecked,
      major
    );
    await testEnv.dbClient.container('majorList').items.create(majorList);

    // Request with forceUpdate = false
    const response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({forceUpdate: false});
    expect(response.status).toBe(202);

    // Wait for 100 ms for mocking
    await new Promise(resolve => setTimeout(resolve, 100));

    // check if major list stayed the same in the database
    const dbOps = await testEnv.dbClient
      .container('majorList')
      .item('wisc.edu')
      .read();
    expect(dbOps.resource.major.length).toBeGreaterThan(0);
    expect(dbOps.resource.major).toContain('Computer Science');
    expect(dbOps.resource.major).toContain('Chemistry');
    expect(dbOps.resource.major).toContain('Physics');
    expect(dbOps.resource.major).toContain('Mathematics');
    expect(dbOps.resource.major).toContain('Biology');
    expect(dbOps.resource.major).toContain('Economics');
    expect(dbOps.resource.major).toContain('Psychology');
    expect(dbOps.resource.major).toContain('English');
    expect(dbOps.resource.major).toContain('History');
    expect(dbOps.resource.major).toContain('Sociology');
    expect(dbOps.resource.id).toBe('wisc.edu');
  });

  test('Success - Forceupdate', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const serverAdminToken = createServerAdminToken(
      'test',
      'admin',
      testEnv.testConfig.jwt.secretKey
    );

    // Prepare majorList in the database for test
    const id = 'wisc.edu';
    const major = [
      'Computer Science',
      'ECE',
      'Animal Science',
      'Physics',
    ].sort();
    const lastChecked = new Date();
    await testEnv.dbClient
      .container('majorList')
      .items.create(
        new MajorList(
          id,
          TestConfig.hash(id, id, JSON.stringify(major)),
          lastChecked,
          major
        )
      );

    // Request with forceUpdate = true
    const response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({forceUpdate: true});
    expect(response.status).toBe(202);

    // Wait for 100 ms for mocking
    await new Promise(resolve => setTimeout(resolve, 100));

    // check if major list is updated in the database
    const dbOps = await testEnv.dbClient
      .container('majorList')
      .item('wisc.edu')
      .read();
    expect(dbOps.resource.major.length).toBeGreaterThan(0);
    expect(dbOps.resource.major).toContain('Computer Science');
    expect(dbOps.resource.major).toContain('Chemistry');
    expect(dbOps.resource.major).toContain('Physics');
    expect(dbOps.resource.major).toContain('Mathematics');
    expect(dbOps.resource.major).toContain('Biology');
    expect(dbOps.resource.major).toContain('Economics');
    expect(dbOps.resource.major).toContain('Psychology');
    expect(dbOps.resource.major).toContain('English');
    expect(dbOps.resource.major).toContain('History');
    expect(dbOps.resource.major).toContain('Sociology');
    expect(dbOps.resource.id).toBe('wisc.edu');
  });
});
