/**
 * express Router middleware for Miscellaneous - tnc APIs
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import TnC from '../datatypes/termsAndCondition/TnC';
import TNCResponseObj from '../datatypes/termsAndCondition/TNCResponseObj';
import ForbiddenError from '../exceptions/ForbiddenError';

// Path: /tnc
const tncRouter = express.Router();

// GET: /tnc
tncRouter.get('/', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin or Application Key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // DB Operations
    const tnc = await TnC.readRecentPublic(dbClient);
    tnc.createdAt = tnc.createdAt as Date;

    // Response
    const resObj: TNCResponseObj = {
      version: tnc.id,
      createdAt: tnc.createdAt.toISOString(),
      content: {
        privacyAct: tnc.content.privacyAct,
        termsAndConditions: tnc.content.termsAndConditions,
      },
    };
    res.status(200).json(resObj);
  } catch (e) {
    next(e);
  }
});

export default tncRouter;
