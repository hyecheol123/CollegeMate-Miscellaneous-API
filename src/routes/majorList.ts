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
    // Header check - serverAdminToken
    const serverAdminToken = req.header('X-SERVER-TOKEN');
    if (serverAdminToken === undefined) {
      throw new UnauthenticatedError();
    }
    verifyServerAdminToken(serverAdminToken, req.app.get('jwtAccessKey'));

    // Check forceUpdate tag from request json
    if (!validateMajorListPostRequest(req.body as MajorListPostRequestObj)) {
      throw new BadRequestError();
    }

    const metaData: MetaData[] = await MajorList.readMetaData(dbClient);
    if (metaData.length !== 0) {
      const lastChecked = metaData[0].lastChecked as Date;
      const now = new Date();
      const diff = now.getTime() - new Date(lastChecked).getTime();
      const diffInDays = diff / (1000 * 3600 * 24);

      if (
        !(req.body as MajorListPostRequestObj).forceUpdate &&
        diffInDays < 5
      ) {
        throw new ConflictError();
      }
    }

    // Response - WebScraping might take a long time
    res.status(202).send();

    // WebScraping - majorList
    const id = 'wisc.edu'; // TODO: Change this to appropriate id (placeholder for now)
    const majorList: string[] = await crawlMajorList(); // for wisc.edu only
    let schoolIndex = -1;
    for (let i = 0; i < metaData.length; i++) {
      if (metaData[i].id === id) {
        schoolIndex = i;
        break;
      }
    }
    // If scale, codes below can be ran in a loop with little modification with id changed

    // If wisc.edu is not on the Database create entry
    if (schoolIndex === -1) {
      // DB Operation - Create metaData entry if metaData does not exist
      await MajorList.create(dbClient, id, majorList);
    } else {
      // Check hash to see if majorList has changed - later use for loop for each domain for scaling
      const hash = ServerConfig.hash(
        metaData[schoolIndex].id,
        metaData[schoolIndex].id,
        JSON.stringify(majorList)
      );

      // DB Operation - Create majorList entry if majorList has changed
      if (hash !== metaData[schoolIndex].hash) {
        await MajorList.update(dbClient, id, majorList);
      }
    }
  } catch (e) {
    next(e);
  }
});

export default majorListRouter;
