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
import MajorListPostRequestObj from '../datatypes/majorList/MajorListPostRequestObj';
import MetaData from '../datatypes/majorList/MetaData';
import {validateMajorListGetRequest} from '../functions/inputValidator/validateMajorListGetRequest';
import {validateMajorListPostRequest} from '../functions/inputValidator/validateMajorListPostRequest';
import ForbiddenError from '../exceptions/ForbiddenError';
import BadRequestError from '../exceptions/BadRequestError';
import UnauthenticatedError from '../exceptions/UnauthenticatedError';
import ConflictError from '../exceptions/ConflictError';
import crawlMajorList from '../functions/majorListCrawler/crawlMajorList';
import ServerConfig from '../ServerConfig';
import verifyServerAdminToken from '../functions/JWT/verifyServerAdminToken';

// Path: /majorList
const majorListRouter = express.Router();

// GET: /majorList
majorListRouter.get('/', async (req, res, next) => {
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
    const majorList = await MajorList.read(dbClient, id);

    // Response
    const resObj: MajorListResponseObj = {
      majorList: majorList.major,
    };
    res.status(200).json(resObj);
  } catch (e) {
    next(e);
  }
});

// POST: /majorList
majorListRouter.post('/', async (req, res, next) => {
  const dbClient: Cosmos.Database = req.app.locals.dbClient;

  try {
    // Header check - serverAdminKey
    const serverAdminToken = req.header('X-SERVER-TOKEN');
    if (serverAdminToken !== undefined) {
      verifyServerAdminToken(serverAdminToken, req.app.get('jwtAccessKey'));
    } else {
      throw new UnauthenticatedError();
    }

    let metaData: MetaData[];
    // Check forceUpdate tag from request json
    if (validateMajorListPostRequest(req.body as MajorListPostRequestObj)) {
      metaData = await MajorList.readMetaData(dbClient);
      const lastChecked = metaData[0].lastChecked as Date;
      const now = new Date();
      const diff = now.getTime() - lastChecked.getTime();
      const diffInDays = diff / (1000 * 3600 * 24);
      if (diffInDays < 5) {
        throw new ConflictError();
      }
    } else {
      throw new BadRequestError();
    }

    // Response - WebScraping might take a long time
    res.status(202);

    // WebScraping - majorList
    const id = 'wisc.edu'; // TODO: Change this to appropriate id (placeholder for now)
    const majorList: string[] = await crawlMajorList.create(); // for wisc.edu only

    // Check hash to see if majorList has changed - later use for loop for each domain for scaling
    const hash = ServerConfig.hash(
      metaData[0].id,
      metaData[0].id,
      JSON.stringify(majorList)
    );

    // DB Operation - Create majorList entry if majorList has changed
    if (hash !== metaData[0].hash) {
      await MajorList.update(dbClient, id, majorList);
    }
  } catch (e) {
    next(e);
  }
});

export default majorListRouter;
