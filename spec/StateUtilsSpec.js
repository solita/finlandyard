'use strict';

var sb = require('./StateBuilder.js');

describe("StateUtils", function() {

  var stateUtils = require('../src/state/StateUtils.js');

  describe("getActors", function() {
    it("should return actors of type", function() {
      expect(stateUtils.getActors({ actors: [
        {name: 'jack', type: 'villain'},
        {name: 'kim', type: 'police'}]}, 'villain'))
        .toEqual([{name: 'jack', type: 'villain'}]);
    });
  });

  describe("applyStateChanges", function() {
    it("should not mark villain caught if there are no police in same location", function() {
      var state = {
        actors: [
          {type: "villain", name: "x", caught: false, location: "HKI"},
          {type: "police", name: "y", caught: false, location: "PSL"}
        ]
      };
      var newState = stateUtils.applyStateChanges(state);
      expect(newState.actors[0].caught).toBe(false);
      expect(newState.actors[1].caught).toBe(false);
    });
    it("Should mark villain caught if in same location than police", function() {
      var state = {
        actors: [
          {type: "villain", name: "x", caught: false, location: "HKI"},
          {type: "police", name: "y", caught: false, location: "HKI"}
        ]
      };
      var newState = stateUtils.applyStateChanges(state);
      expect(newState.actors[0].caught).toBe(true);
      expect(newState.actors[1].caught).toBe(false);
    });
    it("Should not mark villain caught if in in train without police", function() {
      var state = {
        actors: [
          {type: "villain", name: "x", caught: false, train: 1, location: null},
          {type: "police", name: "y", caught: false, train: 2, location: null}
        ]
      };
      var newState = stateUtils.applyStateChanges(state);
      expect(newState.actors[0].caught).toBe(false);
      expect(newState.actors[1].caught).toBe(false);
    });
    it("Should mark villain caught if in same train than police", function() {
      var state = {
        actors: [
          {type: "villain", name: "x", caught: false, train: 1, location: null},
          {type: "police", name: "y", caught: false, train: 1, location: null}
        ]
      };
      var newState = stateUtils.applyStateChanges(state);
      expect(newState.actors[0].caught).toBe(true);
      expect(newState.actors[1].caught).toBe(false);
    });
    it("Should work correctly with multiple actors", function() {
      var state = {
        actors: [
          {type: "villain", name: "a", caught: false, train: 1, location: null},
          {type: "police", name: "b", caught: false, train: 1, location: null},
          {type: "villain", name: "c", caught: false, train: 2, location: null},
          {type: "police", name: "d", caught: false, train: null, location: "HKI"},
          {type: "villain", name: "e", caught: false, train: null, location: "TMP"},
          {type: "police", name: "f", caught: false, train: null, location: "HKI"},
          {type: "villain", name: "g", caught: false, train: null, location: "RVM"},
          {type: "police", name: "h", caught: false, train: null, location: "PSL"},
          {type: "villain", name: "i", caught: false, train: null, location: "RVM"},
          {type: "police", name: "j", caught: false, train: null, location: "TMP"},
        ]
      };
      var newState = stateUtils.applyStateChanges(state);
      expect(newState.actors[0].caught).toBe(true); // Police in same train
      expect(newState.actors[1].caught).toBe(false); // police
      expect(newState.actors[2].caught).toBe(false); // no police in train
      expect(newState.actors[3].caught).toBe(false); // police
      expect(newState.actors[4].caught).toBe(true); // Police in same city
      expect(newState.actors[5].caught).toBe(false); // Police
      expect(newState.actors[6].caught).toBe(false); // another villain in same city
      expect(newState.actors[7].caught).toBe(false); // Police
      expect(newState.actors[8].caught).toBe(false); // another villain in same city
      expect(newState.actors[9].caught).toBe(false); // Police
    });
  });

});
