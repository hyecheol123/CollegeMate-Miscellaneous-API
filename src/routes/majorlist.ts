/**
 * express Router middleware for Miscellaneous - majorList APIs
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import MajorList from '../datatypes/majorList/MajorList';
import MajorListResponseObj from '../datatypes/majorList/MajorListGetResponseObj';
import MajorListGetRequestObj from '../datatypes/majorList/MajorListGetRequestObj';
import {validateMajorListGetRequest} from '../functions/inputValidator/validateMajorListGetRequest';
import ForbiddenError from '../exceptions/ForbiddenError';
import BadRequestError from '../exceptions/BadRequestError';

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

    // if school domain is not provided
    if (!validateMajorListGetRequest(req.body as MajorListGetRequestObj)) {
      throw new BadRequestError();
    }
    // TODO: Change this to appropriate id (placeholder for now)
    // need to update API Documentation for schoolDomain
    const id: string = (req.body as MajorListGetRequestObj).schoolDomain;

    // DB Operations
    const majorlist = await MajorList.read(dbClient, id);

    // Response
    const resObj: MajorListResponseObj = {
      majorList: majorlist.major,
    };
    res.status(200).json(resObj);
  } catch (e) {
    next(e);
  }
});

export default majorlistRouter;
