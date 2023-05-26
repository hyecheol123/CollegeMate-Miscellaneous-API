/**
 * Configuration for the Test Environment.
 * Work identical as ServerConfig of src.
 * 
 * TestConfig.ts contain ip address specific to the machine.
 * The file should be ignored from the version control.
 * 
 * - For WSL: grep -m 1 nameserver /etc/resolv.conf | awk '{print $2}'
 *
 * @author Hyecheol (Jerry) Jang
 */

import * as crypto from 'crypto';
import { ConfigObj } from '../src/datatypes/ConfigObj';
import ServerConfigTemplate from '../src/ServerConfigTemplate';

/**
 * Module contains the configuration
 */
export default class TestConfig extends ServerConfigTemplate {
  /**
   * Constructor for ServerConfig
   *
   * @param identifier test name / used to identify test cases
   * @param endpoint {string | undefined} url of server endpoint
   * @param dbKey {string | undefined} key used to access Azure Cosmos DB
   */
  constructor(
    identifier: string,
    endpoint?: string | undefined,
    dbKey?: string | undefined
  ) {
    const config: ConfigObj = {
      db: {
        endpoint: /* istanbul ignore next */ endpoint
          ? endpoint
          : 'https://localhost:8081',
        key: /* istanbul ignore next */ dbKey
          ? dbKey
          : 'C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==',
        databaseId: `db_${identifier}`,
      },
      expressPort: 3000,
      webpageOrigin: 'https://collegemate.app',
      applicationKey: ['<Android-App-v1>', '<iOS-App-v1>'],
    };
    super(config);
  }

  /**
   * Function to create hashed password
   *
   * @param id user's id (used to generate salt)
   * @param additionalSalt unique additional salt element for each user
   * @param secretString string to be hashed (password, etc)
   * @returns {string} Hashed Password
   */
  static hash(
    id: crypto.BinaryLike,
    additionalSalt: crypto.BinaryLike,
    secretString: crypto.BinaryLike
  ): string {
    const salt: crypto.BinaryLike = id.toString() + additionalSalt.toString();
    return crypto
      .pbkdf2Sync(secretString, salt, 10, 64, 'sha512')
      .toString('base64url');
  }
}
