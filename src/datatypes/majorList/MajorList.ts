/**
 * Define type and used CRUD methods for each majorlist entry
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';
import ServerConfig from '../../ServerConfig';
import MetaData from './MetaData';

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
   * @param {string} id school domain
   * @returns {Promise<MajorList>} majorList entry
   */
  static async read(dbClient: Cosmos.Database, id: string): Promise<MajorList> {
    // Query that finds id with school domain
    const dbOps = await dbClient.container(MAJORLIST).item(id).read();

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

  /**
   * Create a new majorList entry
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id school domain
   * @param {string[]} majorList list of majors
   */
  static async create(
    dbClient: Cosmos.Database,
    id: string,
    majorList: string[]
  ): Promise<void> {
    const lastChecked = new Date();

    // Create new majorList entry
    await dbClient.container(MAJORLIST).items.create({
      id: id,
      hash: ServerConfig.hash(id, id, JSON.stringify(majorList)),
      lastChecked: lastChecked.toISOString(),
      major: majorList,
    });
  }

  /**
   * Read metadata of majorList entry
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @returns {Promise<MetaData[]>} MetaData entry
   */
  static async readMetaData(dbClient: Cosmos.Database): Promise<MetaData[]> {
    // Query that finds id with school domain and returns only metadata
    return (
      await dbClient
        .container(MAJORLIST)
        .items.query<MetaData>({
          query: String.prototype.concat(
            'SELECT c.id, c.hash, c.lastChecked FROM c'
          ),
        })
        .fetchAll()
    ).resources;
  }

  /**
   * Update majorList entry
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   * @param {string} id school domain
   * @param {string[]} majorList list of majors
   * @returns {Promise<void>}
   */
  static async update(
    dbClient: Cosmos.Database,
    id: string,
    majorList: string[]
  ): Promise<void> {
    const lastChecked = new Date();

    // Update majorList entry
    await dbClient
      .container(MAJORLIST)
      .item(id)
      .replace({
        id: id,
        hash: ServerConfig.hash(id, id, JSON.stringify(majorList)),
        lastChecked: lastChecked.toISOString(),
        major: majorList,
      });
  }
}
