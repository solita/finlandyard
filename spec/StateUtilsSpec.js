'use strict';

var sb = require('./StateBuilder.js');
var moment = require('moment');
var log = require('../src/Log.js');

describe("StateUtils", function() {

  var stateUtils = require('../src/state/StateUtils.js');
  var dataUtils = require('../src/state/DataUtils.js');

  beforeEach(function() {
    spyOn(log, 'log');
  });

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
      var state = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .withTimetableEntry('TRAIN-2',
          sb.departure('STATION-2', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-1', moment({hour: 6, minute: 16})))
        .build();
      dataUtils.initData(state);  
      state.actors = [
          {type: "villain", name: "x", caught: false, train: 'TRAIN-1', destination: 'STATION-2', location: null},
          {type: "police", name: "y", caught: false, train: 'TRAIN-2',  destination: 'STATION-1', location: null}];
      state.clockIs = moment({hour: 5, minute: 9});
      var newState = stateUtils.applyStateChanges(state);
      expect(newState.actors[0].caught).toBe(false);
      expect(newState.actors[1].caught).toBe(false);
    });
    it("Should mark villain caught if in same train than police", function() {
      var state = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .withTimetableEntry('TRAIN-2',
          sb.departure('STATION-2', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-1', moment({hour: 6, minute: 16})))
        .build();
      state.actors = [
          {type: "villain", name: "x", caught: false, train: 'TRAIN-1', destination: 'STATION-2', location: null},
          {type: "police", name: "y", caught: false, train: 'TRAIN-1',  destination: 'STATION-2', location: null}];
      state.clockIs = moment({hour: 5, minute: 9});

      var newState = stateUtils.applyStateChanges(state);
      expect(newState.actors[0].caught).toBe(true);
      expect(newState.actors[1].caught).toBe(false);
    });
    it("Should work correctly with multiple actors caughting", function() {
      var state = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .withTimetableEntry('TRAIN-2',
          sb.departure('STATION-2', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-1', moment({hour: 6, minute: 16})))
        .build();
      state.actors = [
        {type: "villain", name: "a", caught: false, train: 'TRAIN-1', destination: 'STATION-2', location: null},
        {type: "police", name: "b", caught: false, train: 'TRAIN-1', destination: 'STATION-2', location: null},
        {type: "villain", name: "c", caught: false, train: 'TRAIN-2',  destination: 'STATION-1',location: null},
        {type: "police", name: "d", caught: false, train: null, location: "HKI"},
        {type: "villain", name: "e", caught: false, train: null, location: "TMP"},
        {type: "police", name: "f", caught: false, train: null, location: "HKI"},
        {type: "villain", name: "g", caught: false, train: null, location: "RVM"},
        {type: "police", name: "h", caught: false, train: null, location: "PSL"},
        {type: "villain", name: "i", caught: false, train: null, location: "RVM"},
        {type: "police", name: "j", caught: false, train: null, location: "TMP"},
        ];
      state.clockIs = moment({hour: 5, minute: 9});

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



  describe('calculateNewPositions', function() {
    it('should not alter actor if trains has not left yet', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .build();

      s.actors = [{name: "Dummy", location: "STATION-1", train: 'TRAIN-1', destination: 'STATION-2'}];
      //console.log(JSON.stringify(s, undefined, 2));

/*
      // Train is not departed
      s.clockIs = moment({hour: 5, minute: 9});
      var newState = stateUtils.calculateNewPositions(s);
      expect(newState.actors[0].location).toBe("STATION-1");

      // Train has departed but not arrived
      s.clockIs = moment({hour: 5, minute: 12});
      var newState = stateUtils.calculateNewPositions(s);
      expect(newState.actors[0].location).toBe(null);
      expect(newState.actors[0].destination).toBe('STATION-2');
      expect(newState.actors[0].latitude).toBeDefined();
      expect(newState.actors[0].longitude).toBeDefined();

      s.clockIs = moment({hour: 6, minute: 20});
      var newState = stateUtils.calculateNewPositions(s);
      expect(newState.actors[0].location).toBe('STATION-2');
      expect(newState.actors[0].destination).toBe(null);
      expect(newState.actors[0].latitude).toBe(41.24242);
      expect(newState.actors[0].longitude).toBe(62.24444);*/
    });
  });
});
