/**
 * Jest Unit Test for POST /majorlist method
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import * as Cosmos from '@azure/cosmos';
import TestEnv from '../../TestEnv';
// import TestConfig from '../../TestConfig';
import ExpressServer from '../../../src/ExpressServer';
import createServerAdminToken from '../../../src/functions/JWT/createServerAdminToken';
import {AccountType} from '../../../src/datatypes/Token/AuthToken';

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

  test('Success - Request from collegemate.app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;

    const serverAdminToken = createServerAdminToken(
      'test',
      'admin' as AccountType,
      'keySecret'
    );

    // Request
    const response = await request(testEnv.expressServer.app)
      .post('/majorlist')
      .set({
        'X-SERVER-TOKEN': serverAdminToken,
      })
      .send({schoolDomain: 'wisc.edu'});
    expect(response.status).toBe(202);

    // check if major list is updated in the database
    const majorList = await testEnv.dbClient
      .container('majorList')
      .item('wisc.edu', 'wisc.edu')
      .read();
    expect(majorList.resource.major.length).toBeGreaterThan(0);
    expect(majorList.resource.major).toContain('Computer Sciences');
    expect(majorList.resource.major).toContain('Chemistry');
    expect(majorList.resource.id).toBe('wisc.edu');
  });
});
