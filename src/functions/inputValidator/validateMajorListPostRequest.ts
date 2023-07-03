/**
 * Validate user input - majorList
 *
 * @author Seok-Hee (Steve) Han <seokheehan01@gmail.com>
 */

import Ajv from 'ajv';

export const validateMajorListPostRequest = new Ajv().compile({
  type: 'object',
  properties: {
    forceUpdate: {type: 'boolean'},
  },
  required: ['forceUpdate'],
  additionalProperties: false,
});
