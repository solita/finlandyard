'use strict';

var moment = require('moment');
var sb = require('./StateBuilder.js');

describe("DataUtils", function() {

  var stateUtils = require('../src/state/DataUtils.js');

  describe("getStationById", function() {
    it("should throw if no station was found for id", function() {
      var s = sb.state().build();
      expect(function() { stateUtils.getStationById(s, "STATIONID")}).toThrow(new Error("No such station: STATIONID"));
    });

    it("should return station with id", function() {
      var s = sb.state().withStation(sb.station("STATIONID")).build();
      expect(stateUtils.getStationById(s, "STATIONID").stationShortCode).toEqual("STATIONID");
    });

    it("should return correct station with id", function() {
      var s = sb.state().withStation(sb.station("STATION-1")).withStation(sb.station("STATION-2")).build();
      expect(stateUtils.getStationById(s, "STATION-2").stationShortCode).toEqual("STATION-2");
    });
  });

  describe("collectConnections", function() {
    it("Should collect connection between two stations", function() {
      var s = sb.state()
        .withStation(sb.station("ID-1", 14.24444, 42.24242))
        .withStation(sb.station("ID-2", 43.42424, 13.2424))
        .withTimetableEntry("TRAIN-1",
            sb.departure("ID-1"),
            sb.arrival("ID-2"))
        .build();
      expect(stateUtils.collectConnections(s))
        .toEqual([{from: [14.24444, 42.24242], to: [43.42424, 13.2424]}]);
    });
    it("Should collect transitive connections between stations", function() {
      var s = sb.state()
        .withStation(sb.station("ID-1", 14.24444, 42.24242))
        .withStation(sb.station("ID-2", 43.42424, 13.2424))
        .withStation(sb.station("ID-3", 46.42424, 34.2424))
        .withTimetableEntry("TRAIN-1",
            sb.departure("ID-1"),
            sb.arrival("ID-2"),
            sb.departure("ID-2"),
            sb.arrival("ID-3"))
        .build();
      expect(stateUtils.collectConnections(s))
        .toEqual([{from: [14.24444, 42.24242], to: [43.42424, 13.2424]}, {from: [43.42424, 13.2424], to: [46.42424, 34.2424]}]);
    });
    it("Should pick connection only once for different routes", function() {
      var s = sb.state()
        .withStation(sb.station("ID-1", 14.24444, 42.24242))
        .withStation(sb.station("ID-2", 43.42424, 13.2424))
        .withTimetableEntry("TRAIN-1",
            sb.departure("ID-1"),
            sb.arrival("ID-2"))
        .withTimetableEntry("TRAIN-2",
            sb.departure("ID-1"),
            sb.arrival("ID-2"))
        .build();

      expect(stateUtils.collectConnections(s).length).toEqual(1);
    });
    it("Should pick connection only once for opposite routes", function() {
      var s = sb.state()
        .withStation(sb.station("ID-1", 14.24444, 42.24242))
        .withStation(sb.station("ID-2", 43.42424, 13.2424))
        .withTimetableEntry("TRAIN-1",
            sb.departure("ID-1"),
            sb.arrival("ID-2"))
        .withTimetableEntry("TRAIN-2",
            sb.departure("ID-2"),
            sb.arrival("ID-1"))
        .build();
      expect(stateUtils.collectConnections(s).length).toEqual(1);
    });
  });

  describe("connectedStations", function() {
    it("Should return nothing without timetable", function() {
      var s = sb.state()
        .withStation(sb.station("ID-1", 14.24444, 42.24242))
        .build();
      expect(stateUtils.connectedStations(s).length).toEqual(0);
    });
    it("Should return stations in timetable", function() {
      var s = sb.state()
        .withStation(sb.station("ID-1", 14.24444, 42.24242))
        .withStation(sb.station("ID-2", 62.24444, 41.24242))
        .withStation(sb.station("ID-3", 32.24444, 45.24242))
        .withTimetableEntry("TRAIN-1",
            sb.departure("ID-1"),
            sb.arrival("ID-2"))
        .build();
      expect(stateUtils.connectedStations(s).length).toEqual(2);
    });
  });

  describe("trainsLeavingFrom", function() {
    it('Should find leaving trains when one is leaving and clock is before departure', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .build();
      s.clockIs = moment({hour: 4, minute: 10});
      expect(stateUtils.trainsLeavingFrom(s, "STATION-1").length).toEqual(1);
    });
    it('Should not find already left trains', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .build();
      s.clockIs = moment({hour: 7, minute: 10});
      expect(stateUtils.trainsLeavingFrom(s, "STATION-1").length).toEqual(0);
    });
    it('Should find trains actor can jump into', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})),
          sb.departure('STATION-2', moment({hour: 6, minute: 19}),
          sb.arrival('STATION-3', moment({hour: 8, minute: 16}))))
        .build();
      s.clockIs = moment({hour: 5, minute: 10});
      expect(stateUtils.trainsLeavingFrom(s, "STATION-2").length).toEqual(1);
    });
  });
});
