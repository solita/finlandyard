'use strict';

var sb = require('./StateBuilder.js');

describe("StateUtils", function() {

  var stateUtils = require('../src/StateUtils.js');

  describe("getActors", function() {
    it("should return actors of type", function() {
      expect(stateUtils.getActors({ actors: [
        {name: 'jack', type: 'villain'},
        {name: 'kim', type: 'police'}]}, 'villain'))
        .toEqual([{name: 'jack', type: 'villain'}]);
    });
  });

});
