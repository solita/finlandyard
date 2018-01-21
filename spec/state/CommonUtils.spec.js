'use strict';

const expect = require('chai').expect
var sb = require('../StateBuilder.js');
var moment = require('moment');
var log = require('../../src/utils/Log.js');

describe("engine/CommonUtils.js", function() {

  var CommonUtils = require('../../src/state/CommonUtils.js');

  describe("getActors()", function() {

    it("should return actors of type", function() {
      expect(CommonUtils.getActors({ actors: [
        {name: 'jack', type: 'villain'},
        {name: 'kim', type: 'police'}]}, 'villain'))
        .to.deep.equal([{name: 'jack', type: 'villain'}]);
    });

  });
});
