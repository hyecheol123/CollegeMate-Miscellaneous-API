/**
 * express Router middleware for Miscellaneous - announcement APIs
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

import * as express from 'express';
import * as Cosmos from '@azure/cosmos';
import Announcement from '../datatypes/announcement/Announcement';
import AnnouncementListResponseObj from '../datatypes/announcement/AnnouncementListResponseObj';
import ForbiddenError from '../exceptions/ForbiddenError';

// Path: /announcement
const announcementRouter = express.Router();

// Get /announcement
announcementRouter.get('/', async (req, res, next) => {
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
    const availableAnnouncements =
      await Announcement.readAvailableAnnouncements(dbClient);

    // Response
    const announcementList: AnnouncementListResponseObj['announcementList'] =
      availableAnnouncements.length !== 0
        ? availableAnnouncements.map(data => ({
            id: data.id,
            title: data.title,
            content: data.content,
            datetime: (data.createdAt as Date).toISOString(),
          }))
        : undefined;
    const resObj: AnnouncementListResponseObj = {
      numAnnouncement: availableAnnouncements.length,
      announcementList: announcementList,
    };
    res.status(200).json(resObj);
  } catch (e) {
    next(e);
  }
});

export default announcementRouter;
