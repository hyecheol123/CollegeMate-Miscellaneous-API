/**
 * Define type for Announcement List Response
 *   - numAnnouncement
 *   - announcementList
 *     - id
 *     - title
 *     - content
 *     - datetime
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 */

export default interface AnnouncementListResponseObj {
  numAnnouncement: number;
  announcementList?: {
    id: string;
    title: string;
    content: string;
    datetime: string;
  }[];
}
