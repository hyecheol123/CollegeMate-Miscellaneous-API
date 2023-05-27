/**
 * Setup test environment
 *  - Setup Database for testing
 *  - Build table that will be used during the testing
 *  - Setup express server
 *
 * Teardown test environment after test
 *  - Remove used table and close database connection from the express server
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import * as crypto from 'crypto';
import * as Cosmos from '@azure/cosmos';
import TestConfig from './TestConfig';
import ExpressServer from '../src/ExpressServer';
import TnC from '../src/datatypes/termsAndCondition/TnC';
import Announcement from '../src/datatypes/announcement/Announcement';

/**
 * Class for Test Environment
 */
export default class TestEnv {
  testConfig: TestConfig; // Configuration Object (to use hash function later)
  expressServer: ExpressServer | undefined; // Express Server Object
  dbClient: Cosmos.Database | undefined; // DB Client Object
  dbIdentifier: string; // unique identifier string for the database

  /**
   * Constructor for TestEnv
   *  - Setup express server
   *  - Setup db client
   *
   * @param identifier Identifier to specify the test
   */
  constructor(identifier: string) {
    // Hash identifier to create new identifier string
    this.dbIdentifier = crypto
      .createHash('md5')
      .update(identifier)
      .digest('hex');

    // Generate TestConfig obj
    this.testConfig = new TestConfig(this.dbIdentifier);
  }

  /**
   * beforeEach test case, run this function
   * - Setup Database for testing
   * - Build table that will be used during the testing
   */
  async start(): Promise<void> {
    // Setup DB
    const dbClient = new Cosmos.CosmosClient({
      endpoint: this.testConfig.db.endpoint,
      key: this.testConfig.db.key,
    });
    const dbOps = await dbClient.databases.create({
      id: this.testConfig.db.databaseId,
    });
    /* istanbul ignore next */
    if (dbOps.statusCode !== 201) {
      throw new Error(JSON.stringify(dbOps));
    }
    this.dbClient = dbClient.database(this.testConfig.db.databaseId);

    // Create resources
    // termsAndCondition container
    let containerOps = await this.dbClient.containers.create({
      id: 'termsAndCondition',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [{path: '/content/?'}, {path: '/"_etag"/?'}],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }

    // termsAndCondition data
    const termsAndConditionSamples: TnC[] = [];
    // v1.0.0, 2021-03-10, public, "This is too old"
    let tncTimestamp = new Date('2021-03-10T10:50:43.000Z');
    termsAndConditionSamples.push(
      new TnC('v1.0.0', tncTimestamp, true, 'This is too old')
    );
    // v1.0.2, 2021-03-12, private, "This is too old, not public"
    tncTimestamp = new Date('2021-03-12T10:15:42.000Z');
    termsAndConditionSamples.push(
      new TnC('v1.0.2', tncTimestamp, false, 'This is too old, not public')
    );
    // v2.0.0, 2023-03-12, public, "Terms and Condition"
    tncTimestamp = new Date('2023-03-12T10:15:42.000Z');
    termsAndConditionSamples.push(
      new TnC('v2.0.0', tncTimestamp, true, 'Terms and Condition')
    );
    // v2.0.1, 2023-03-15, private, "This is not public"
    tncTimestamp = new Date('2023-03-15T10:15:42.000Z');
    termsAndConditionSamples.push(
      new TnC('v2.0.1', tncTimestamp, false, 'This is not public')
    );
    for (let index = 0; index < termsAndConditionSamples.length; ++index) {
      await this.dbClient
        .container('termsAndCondition')
        .items.create(termsAndConditionSamples[index]);
    }

    // announcement container
    containerOps = await this.dbClient.containers.create({
      id: 'announcement',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [
          {path: '/title/?'},
          {path: '/content/?'},
          {path: '/"_etag"/?'},
        ],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }

    // announcement data
    const announcementSamples: Announcement[] = [];
    // "Beta Testing", "We are still developing features, comments and reviews are welcome", 2021-03-10, 2100-12-31
    let title = 'Beta Testing';
    let content =
      'We are still developing features, comments and reviews are welcome';
    let createdAtAnnouncementTimestamp = new Date('2021-03-10T10:50:43.000Z');
    let expiresAtAnnouncementTimestamp = new Date('2100-12-31T10:50:43.000Z');
    announcementSamples.push(
      new Announcement(
        TestConfig.hash(
          'announcement',
          createdAtAnnouncementTimestamp.toISOString(),
          `${title} + ${content}`
        ),
        title,
        content,
        createdAtAnnouncementTimestamp,
        expiresAtAnnouncementTimestamp
      )
    );
    // Expired Announcement
    // "Testing", "Announcement Test", 2021-02-10, 2021-02-11
    title = 'Testing';
    content = 'Announcement Test';
    createdAtAnnouncementTimestamp = new Date('2021-02-10T10:50:43.000Z');
    expiresAtAnnouncementTimestamp = new Date('2021-02-11T10:50:43.000Z');
    announcementSamples.push(
      new Announcement(
        TestConfig.hash(
          'announcement',
          createdAtAnnouncementTimestamp.toISOString(),
          `${title} + ${content}`
        ),
        title,
        content,
        createdAtAnnouncementTimestamp,
        expiresAtAnnouncementTimestamp
      )
    );
    // About to Expire Announcement
    // "Temp Announcement", "Temporary Announcement", <Yesterday>, <Tomorrow>
    title = 'Temp Announcement';
    content = 'Temporary Announcement';
    createdAtAnnouncementTimestamp = new Date();
    createdAtAnnouncementTimestamp.setDate(
      createdAtAnnouncementTimestamp.getDate() - 1
    );
    expiresAtAnnouncementTimestamp = new Date();
    expiresAtAnnouncementTimestamp.setDate(
      expiresAtAnnouncementTimestamp.getDate() + 1
    );
    announcementSamples.push(
      new Announcement(
        TestConfig.hash(
          'announcement',
          createdAtAnnouncementTimestamp.toISOString(),
          `${title} + ${content}`
        ),
        title,
        content,
        createdAtAnnouncementTimestamp,
        expiresAtAnnouncementTimestamp
      )
    );
    // Just Expired Announcement
    // "Expired Announcement", "Just Expired", <2 Days ago>, <Yesterday>
    title = 'Expired Announcement';
    content = 'Just Expired';
    createdAtAnnouncementTimestamp = new Date();
    createdAtAnnouncementTimestamp.setDate(
      createdAtAnnouncementTimestamp.getDate() - 2
    );
    expiresAtAnnouncementTimestamp = new Date();
    expiresAtAnnouncementTimestamp.setDate(
      expiresAtAnnouncementTimestamp.getDate() - 1
    );
    announcementSamples.push(
      new Announcement(
        TestConfig.hash(
          'announcement',
          createdAtAnnouncementTimestamp.toISOString(),
          `${title} + ${content}`
        ),
        title,
        content,
        createdAtAnnouncementTimestamp,
        expiresAtAnnouncementTimestamp
      )
    );
    for (let index = 0; index < announcementSamples.length; ++index) {
      await this.dbClient
        .container('announcement')
        .items.create(announcementSamples[index]);
    }

    // Setup Express Server
    this.expressServer = new ExpressServer(this.testConfig);
  }

  /**
   * Teardown test environment after test
   *  - Remove used resources (DB)
   *  - close database/redis connection from the express server
   */
  async stop(): Promise<void> {
    // Drop database
    await (this.dbClient as Cosmos.Database).delete();

    // Close database connection of the express server
    await (this.expressServer as ExpressServer).closeServer();

    // Close database connection used during tests
    await (this.dbClient as Cosmos.Database).client.dispose();
  }
}
