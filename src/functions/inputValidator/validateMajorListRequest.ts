/**
 * Validate user input - majorList
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateMajorListRequest = new Ajv().compile({
  type: 'object',
  properties: {
    schoolDomain: {
      type: 'string',
    },
    requred: ['schoolDomain'],
  },
  additionalProperties: false,
});