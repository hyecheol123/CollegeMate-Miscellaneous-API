/**
 * Define type and used CRUD methods for each announcement entry
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';

// DB Container id
const ANNOUNCEMENT = 'announcement';

export default class Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: Date | string; // Saved as ISOString
  expireAt: Date | string; // Saved as ISOString

  constructor(
    id: string,
    title: string,
    content: string,
    createdAt: Date,
    expireAt: Date
  ) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.createdAt = createdAt;
    this.expireAt = expireAt;
  }

  /**
   * Retrieve all unexpired announcement from DB
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   */
  static async readAvailableAnnouncements(
    dbClient: Cosmos.Database
  ): Promise<Announcement[]> {
    // Query
    const dbOps = await dbClient
      .container(ANNOUNCEMENT)
      .items.query<Announcement>({
        query: String.prototype.concat(
          `SELECT * FROM ${ANNOUNCEMENT} `,
          `WHERE ${ANNOUNCEMENT}.expiresAt >= GetCurrentDateTime()`
        ),
      })
      .fetchAll();

    // Create list of Announcements
    const availableAnnouncements = dbOps.resources.map(
      dbData =>
        new Announcement(
          dbData.id,
          dbData.title,
          dbData.content,
          new Date(dbData.createdAt),
          new Date(dbData.expireAt)
        )
    );
    return availableAnnouncements;
  }
}
