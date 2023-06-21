/**
 * File to execute when jest test environmet is started.
 * Mocking crawlMajorList module
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

// Major List Mock Data
jest.mock('../src/functions/majorListCrawler/crawlMajorList', () => ({
  __esModule: true,
  default: jest.fn(async () => {
    return [
      'Computer Science',
      'Chemistry',
      'Physics',
      'Mathematics',
      'Biology',
      'Economics',
      'Psychology',
      'English',
      'History',
      'Sociology',
    ].sort();
  }),
}));
