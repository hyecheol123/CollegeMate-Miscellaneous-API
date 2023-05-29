/**
 * express Router middleware for Miscellaneous - majorList APIs
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import MajorList from '../datatypes/major/MajorList';
import MajorListResponseObj from '../datatypes/major/MajorListResponseObj';
import ForbiddenError from '../exceptions/ForbiddenError';

// Path: /majorlist
const majorlistRouter = express.Router();

// GET: /majorlist
majorlistRouter.get('/', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Check Origin or Application Key
    if (
      req.header('Origin') !== req.app.get('webpageOrigin') &&
      !req.app.get('applicationKey').includes(req.header('X-APPLICATION-KEY'))
    ) {
      throw new ForbiddenError();
    }

    // TODO: Change this to appropriate id (placeholder for now)
    // need to update API Documentation for schoolDomain
    const id: string = req.body.schoolDomain;

    // DB Operations
    const majorlist = await MajorList.read(dbClient, id);

    // Response
    const resObj: MajorListResponseObj = {
      majorlist: majorlist.major,
    };
    res.status(200).json(resObj);
  } catch (e) {
    next(e);
  }
});

export default majorlistRouter;
