/**
 * Define type and used CRUD methods for each majorlist entry
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';

// DB Container id
const MAJORLIST = 'majorList';

export default class MajorList {
  id: string; // indicates school domain
  hash: string;
  lastChecked: Date | string;
  major: string[];

  constructor(id: string, hash: string, lastChecked: Date, major: string[]) {
    this.id = id;
    this.hash = hash;
    this.lastChecked = lastChecked;
    this.major = major;
  }

  /**
   * Retrieve all majors from DB
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} schoolDomain school domain
   */
  static async read(
    dbClient: Cosmos.Database,
    schoolDomain: string
  ): Promise<MajorList> {
    // Query that finds id with school domain
    const dbOps = await dbClient.container(MAJORLIST).item(schoolDomain).read();

    if (dbOps.statusCode === 404) {
      throw new NotFoundError();
    }

    return new MajorList(
      dbOps.resource.id,
      dbOps.resource.hash,
      dbOps.resource.lastChecked,
      dbOps.resource.major
    );
  }
}
