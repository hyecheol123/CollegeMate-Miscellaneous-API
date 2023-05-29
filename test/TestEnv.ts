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
import MajorList from '../src/datatypes/majorList/MajorList';

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

    // majorList container
    containerOps = await this.dbClient.containers.create({
      id: 'majorList',
      indexingPolicy: {
        indexingMode: 'consistent',
        automatic: true,
        includedPaths: [{path: '/*'}],
        excludedPaths: [
          {path: '/hash/?'},
          {path: '/major/?'},
          {path: '/lastChecked/?'},
          {path: '/"_etag"/?'},
        ],
      },
    });
    /* istanbul ignore next */
    if (containerOps.statusCode !== 201) {
      throw new Error(JSON.stringify(containerOps));
    }

    // majorlist data
    const majorlistSamples: MajorList[] = [];
    // wisc.edu, 2021-01-02, ["Computer Science", "ECE", "Animal Science", "Physics"]
    let id = 'wisc.edu';
    let major = ['Computer Science', 'ECE', 'Animal Science', 'Physics'].sort();
    let lastChecked = new Date('2021-01-02T10:15:42.000Z');
    majorlistSamples.push(
      new MajorList(
        id,
        TestConfig.hash(id, lastChecked.toISOString(), JSON.stringify(major)),
        lastChecked,
        major
      )
    );
    // uw.edu, 2022-03-12, ["Computer Science", "ECE", "Math"]
    id = 'uw.edu';
    major = ['Computer Science', 'ECE', 'Math'].sort();
    lastChecked = new Date('2022-03-12T10:15:42.000Z');
    majorlistSamples.push(
      new MajorList(
        id,
        TestConfig.hash(id, lastChecked.toISOString(), JSON.stringify(major)),
        lastChecked,
        major
      )
    );
    // liberty.edu, 2022-09-21, ["Computer Science", "ECE", "Math", "Physics"]
    id = 'liberty.edu';
    major = ['Computer Science', 'ECE', 'Math', 'Physics'].sort();
    lastChecked = new Date('2022-09-21T10:15:42.000Z');
    majorlistSamples.push(
      new MajorList(
        id,
        TestConfig.hash(id, lastChecked.toISOString(), JSON.stringify(major)),
        lastChecked,
        major
      )
    );
    for (let index = 0; index < majorlistSamples.length; ++index) {
      await this.dbClient
        .container('majorList')
        .items.create(majorlistSamples[index]);
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
