/**
 * Define type for TNC Response
 *  - version
 *  - createdAt
 *  - content:
 *    - privacyAct
 *    - termsAndConditions
 *
 * @author Hyecheol (Jerry) Jang <hyecheol123@gmail.com>
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

/**
 * Interface for TNCResponseObj
 */
export default interface TNCResponseObj {
  version: string;
  createdAt: string;
  content: {
    privacyAct: string;
    termsAndConditions: string;
  };
}
