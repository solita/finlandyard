import {expect} from 'chai';
import CommonUtils from '../../src/state/CommonUtils.js';

describe('engine/CommonUtils.js', () => {
  describe('getActors()', () => {
    it('should return actors of type', () => {
      expect(CommonUtils.getActors(
        {
          actors: [
            {name: 'jack', type: 'villain'},
            {name: 'kim', type: 'police'}
          ]
        }, 'villain')).to.deep.equal([{name: 'jack', type: 'villain'}]
      );
    });
  });
});
