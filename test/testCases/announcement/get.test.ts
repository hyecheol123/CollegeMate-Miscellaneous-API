/**
 * Jest Unit Test for GET /announcement method
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

// eslint-disable-next-line node/no-unpublished-import
import * as request from 'supertest';
import TestEnv from '../../TestEnv';
import ExpressServer from '../../../src/ExpressServer';
import * as Cosmos from '@azure/cosmos';

describe('GET /announcement - Get Announcements', () => {
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
    let response = await request(testEnv.expressServer.app).get(
      '/announcement'
    );
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request - With wrong Origin Header
    response = await request(testEnv.expressServer.app)
      .get('/announcement')
      .set({Origin: 'https://suspicious.com'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');

    // Request - With wrong applicationKey Header
    response = await request(testEnv.expressServer.app)
      .get('/announcement')
      .set({'X-APPLICATION-KEY': '<Suspicious-App>'});
    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden');
  });

  test('Success - Request from collegemate.app', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const response = await request(testEnv.expressServer.app)
      .get('/announcement')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.numAnnouncement).toBe(2);
    expect(response.body.announcementList.length).toBe(2);
    expect(response.body.announcementList[0].title).toBe('Beta Testing');
    expect(response.body.announcementList[0].content).toBe(
      'We are still developing features, comments and reviews are welcome'
    );
    let datetime = new Date(response.body.announcementList[0].datetime);
    expect(datetime.getFullYear()).toBe(2021);
    expect(datetime.getMonth()).toBe(2);
    expect(datetime.getDate()).toBe(10);
    expect(response.body.announcementList[1].title).toBe('Temp Announcement');
    expect(response.body.announcementList[1].content).toBe(
      'Temporary Announcement'
    );
    datetime = new Date(response.body.announcementList[1].datetime);
    const expectedDatetime = new Date();
    expectedDatetime.setDate(expectedDatetime.getDate() - 1);
    expect(datetime.getFullYear()).toBe(expectedDatetime.getFullYear());
    expect(datetime.getMonth()).toBe(expectedDatetime.getMonth());
    expect(datetime.getDate()).toBe(expectedDatetime.getDate());
  });

  test('Success - Request from Mobile Application', async () => {
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Request
    const response = await request(testEnv.expressServer.app)
      .get('/announcement')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.numAnnouncement).toBe(2);
    expect(response.body.announcementList.length).toBe(2);
    expect(response.body.announcementList[0].title).toBe('Beta Testing');
    expect(response.body.announcementList[0].content).toBe(
      'We are still developing features, comments and reviews are welcome'
    );
    let datetime = new Date(response.body.announcementList[0].datetime);
    expect(datetime.getFullYear()).toBe(2021);
    expect(datetime.getMonth()).toBe(2);
    expect(datetime.getDate()).toBe(10);
    expect(response.body.announcementList[1].title).toBe('Temp Announcement');
    expect(response.body.announcementList[1].content).toBe(
      'Temporary Announcement'
    );
    datetime = new Date(response.body.announcementList[1].datetime);
    const expectedDatetime = new Date();
    expectedDatetime.setDate(expectedDatetime.getDate() - 1);
    expect(datetime.getFullYear()).toBe(expectedDatetime.getFullYear());
    expect(datetime.getMonth()).toBe(expectedDatetime.getMonth());
    expect(datetime.getDate()).toBe(expectedDatetime.getDate());
  });

  test('Success - No Announcement Cases', async () => {
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Remove all terms and condition from DB
    const itemList = (
      await testEnv.dbClient
        .container('announcement')
        .items.readAll()
        .fetchAll()
    ).resources;
    for (let index = 0; index < itemList.length; index++) {
      await testEnv.dbClient
        .container('announcement')
        .item(itemList[index].id as string)
        .delete();
    }

    // Request - From web
    let response = await request(testEnv.expressServer.app)
      .get('/announcement')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.numAnnouncement).toBe(0);

    // Request - From app
    response = await request(testEnv.expressServer.app)
      .get('/announcement')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.numAnnouncement).toBe(0);
  });

  test('Success - Only Expired Announcement Cases', async () => {
    testEnv.dbClient = testEnv.dbClient as Cosmos.Database;
    testEnv.expressServer = testEnv.expressServer as ExpressServer;

    // Remove all terms and condition from DB
    const itemList = (
      await testEnv.dbClient
        .container('announcement')
        .items.query({
          query: String.prototype.concat(
            'SELECT * from announcement ',
            'where announcement.expireAt > GetCurrentDateTime()'
          ),
        })
        .fetchAll()
    ).resources;
    for (let index = 0; index < itemList.length; index++) {
      await testEnv.dbClient
        .container('announcement')
        .item(itemList[index].id as string)
        .delete();
    }

    // Request - From web
    let response = await request(testEnv.expressServer.app)
      .get('/announcement')
      .set({Origin: 'https://collegemate.app'});
    expect(response.status).toBe(200);
    expect(response.body.numAnnouncement).toBe(0);

    // Request - From app
    response = await request(testEnv.expressServer.app)
      .get('/announcement')
      .set({'X-APPLICATION-KEY': '<Android-App-v1>'});
    expect(response.status).toBe(200);
    expect(response.body.numAnnouncement).toBe(0);
  });
});
