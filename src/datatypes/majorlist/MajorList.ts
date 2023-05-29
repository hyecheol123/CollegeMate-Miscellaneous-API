/**
 * Define type and used CRUD methods for each majorlist entry
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';

// DB Container id
const MAJORLIST = 'majorlist';

export default class MajorList {
  id: string; // indicates school domain
  hash: string;
  lastChecked: Date;
  major: string[];

  constructor(
    id: string,
    hash: string,
    lastChecked: Date,
    major: string[]
  ) {
    this.id = id;
    this.hash = hash;
    this.lastChecked = lastChecked;
    this.major = major;
  }

  /**
   * Retrieve all majors from DB
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id school domain
   */
  static async read(
    dbClient: Cosmos.Database,
    id: string
  ): Promise<MajorList> {
    let dbOps;

    try {
      // Query that finds id with school domain
      dbOps = await dbClient
      .container(MAJORLIST)
      .item(id)
      .read();
    } catch (e) {
      // Check if item exists
      if ((e as Cosmos.ErrorResponse).code === 404) {
        throw new NotFoundError();
      } else {
        throw e;
      }
    }

    return new MajorList(
      dbOps.resource.id,
      dbOps.resource.hash,
      dbOps.resource.lastChecked,
      dbOps.resource.major
    );
  }
}