/**
 * Define type and used CRUD methods for each tnc entry
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as Cosmos from '@azure/cosmos';
import NotFoundError from '../../exceptions/NotFoundError';

// DB Container id
const TNC = 'termsAndConditions';

interface publicTnC {
  id: string;
  createdAt: Date | string; // Saved as ISOString
  content: {
    privacyAct: string;
    termsAndConditions: string;
  };
}

export default class TnC implements publicTnC {
  id: string;
  createdAt: Date | string; // Saved as ISOString
  public: boolean;
  content: {
    privacyAct: string;
    termsAndConditions: string;
  };

  /**
   * Constructor for termsAndCondition Object
   *
   * @param id {string} version of terms and condition
   * @param createdAt {Date} specify when this Terms and Condition created
   * @param publicFlag {boolean} indicate whether this Terms and Condition and Privacy Agreement is
   *     publicly available or not
   * @param privacyAct {string} Privacy Agreement
   * @param termsAndConditions {string} Terms and Condition
   */
  constructor(
    id: string,
    createdAt: Date,
    publicFlag: boolean,
    privacyAct: string,
    termsAndConditions: string
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.public = publicFlag;
    this.content = {
      privacyAct: privacyAct,
      termsAndConditions: termsAndConditions,
    };
  }

  /**
   * Retrieve the most recent public Terms and Condition form DB
   *
   * @param {Cosmos.Database} dbClient Cosmos DB Client
   */
  static async readRecentPublic(dbClient: Cosmos.Database): Promise<TnC> {
    // Query
    const dbOps = await dbClient
      .container(TNC)
      .items.query<TnC>({
        query: String.prototype.concat(
          `SELECT TOP 1 * FROM ${TNC} as tnc `,
          'WHERE tnc.public = true ORDER BY tnc.createdAt DESC'
        ),
      })
      .fetchAll();

    // Error handling
    if (dbOps.resources.length !== 1) {
      throw new NotFoundError();
    }

    const recentPublicTnC: TnC = dbOps.resources[0];
    recentPublicTnC.createdAt = new Date(recentPublicTnC.createdAt);
    return recentPublicTnC;
  }
}
