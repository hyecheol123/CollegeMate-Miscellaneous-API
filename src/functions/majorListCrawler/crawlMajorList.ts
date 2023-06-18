/**
 * Scraping major list from UW-Madison webpage
 *
 * @author Jeonghyeon Park <fishbox0923@gmail.com>
 */

import {Builder, Browser, By, until} from 'selenium-webdriver';
// import chromeDriver from 'selenium-webdriver/chrome';
import * as chromeDriver from 'selenium-webdriver/chrome';
const chromeOptions = new chromeDriver.Options();
chromeOptions.addArguments('--headless');
chromeOptions.addArguments('--disable-gpu');
chromeOptions.addArguments('--no-sandbox');

/**
 * Class representing a Major List Crawler.
 */
export default class crawlMajorList {
  /**
   * Creates an instance of MajorListCrawler.
   * @returns {Promise<string[]>} A promise that resolves to an array of majors.
   */
  static async create(): Promise<string[]> {
    const driver = await new Builder()
      .forBrowser(Browser.CHROME)
      .setChromeOptions(chromeOptions)
      .build();

    try {
      //set up and find elements from the web page
      await driver.get('https://www.wisc.edu/academics/majors/#majors');
      await driver.wait(until.elementLocated(By.css('#uw-footer-notices')));
      const table = await driver.findElement(By.css('.uw-programs'));
      // Retrieve all first index td elements within the table
      const temp = await table.findElements(By.css('td:first-child'));

      /**
       * Filter and clean up the major names.
       * @param {Object} major - The major element.
       * @returns {Promise<string>} A promise that resolves to the cleaned up major name.
       */
      const filteredList = await Promise.all(
        temp.map(async major => {
          const text = await major.getText();
          return text.trim();
        })
      );

      // Remove empty elements from the array
      const majorList = filteredList.filter((major: string) => major !== '');

      // Check the list and push to the array, then sort by alphabertical order
      const majorListArray: string[] = [];
      for (const major of majorList) {
        majorListArray.push(major);
      }
      majorListArray.sort();

      //return
      return majorListArray;
    } finally {
      await driver.quit();
    }
  }
}

// (async () => {
//   try {
//     const majorListArray = await crawlMajorList.create();
//     console.log(majorListArray);
//   } catch (error) {
//     console.error('An error occurred:', error);
//   }
// })();
