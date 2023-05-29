/**
 * Define 400 Bad Request Error based on HTTPError
 * Contains HTTP Status code and message for commonly caused 400 Not Found Error
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import HTTPError from './HTTPError';

/**
 * Authentication Error is a type of HTTPError, of which status code is 404
 */
export default class NotFoundError extends HTTPError {
  /**
   * Constructor for NotFound Error
   */
  constructor() {
    super(400, 'Bad Request');
  }
}
