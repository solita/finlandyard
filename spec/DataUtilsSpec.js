'use strict';

var sb = require('./StateBuilder.js');
var clock = require('../src/Clock.js');

describe("DataUtils", function() {

  var dataUtils = require('../src/state/DataUtils.js');

  describe("getStationById", function() {
    it("should throw if no station was found for id", function() {
      var s = sb.state().build();
      dataUtils.initData(s);
      expect(function() { dataUtils.getStationById("STATIONID")}).toThrow(new Error("No such station: STATIONID"));
    });

    it("should return station with id", function() {
      var s = sb.state().withStation(sb.station("STATIONID")).build();
      dataUtils.initData(s);
      expect(dataUtils.getStationById( "STATIONID").stationShortCode).toEqual("STATIONID");
    });

    it("should return correct station with id", function() {
      var s = sb.state().withStation(sb.station("STATION-1")).withStation(sb.station("STATION-2")).build();
      dataUtils.initData(s);
      expect(dataUtils.getStationById("STATION-2").stationShortCode).toEqual("STATION-2");
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
      dataUtils.initData(s);
      expect(dataUtils.collectConnections())
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
      dataUtils.initData(s);
      expect(dataUtils.collectConnections())
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
      dataUtils.initData(s);
      expect(dataUtils.collectConnections().length).toEqual(1);
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
      dataUtils.initData(s);
      expect(dataUtils.collectConnections().length).toEqual(1);
    });
  });

  describe("connectedStations", function() {
    it("Should return nothing without timetable", function() {
      var s = sb.state()
        .withStation(sb.station("ID-1", 14.24444, 42.24242))
        .build();
      dataUtils.initData(s);
      expect(dataUtils.connectedStations().length).toEqual(0);
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
      dataUtils.initData(s);
      expect(dataUtils.connectedStations().length).toEqual(2);
    });
  });

  describe("trainsLeavingFrom", function() {
    it('Should find leaving trains when one is leaving and clock is before departure', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', clock(5, 10)),
          sb.arrival('STATION-2', clock(5, 17)))
        .build();
      dataUtils.initData(s);
      var clockIs = clock(4, 10);
      expect(dataUtils.trainsLeavingFrom(clockIs, "STATION-1").length).toEqual(1);
    });
    it('Should not find already left trains', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', clock(5, 10)),
          sb.arrival('STATION-2', clock(5, 16)))
        .build();
      dataUtils.initData(s);
      var clockIs = clock(7, 10);
      expect(dataUtils.trainsLeavingFrom(clockIs, "STATION-1").length).toEqual(0);
    });
    it('Should find trains actor can jump into', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', clock(5, 10)),
          sb.arrival('STATION-2', clock(6, 16)),
          sb.departure('STATION-2', clock(6, 19),
          sb.arrival('STATION-3', clock(8, 16))))
        .build();
      dataUtils.initData(s);
      var clockIs = clock(5, 10);
      expect(dataUtils.trainsLeavingFrom(clockIs, "STATION-2").length).toEqual(1);
    });
  });

  describe("howCanIGetTo", function() {
    it('Should find without transition', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', clock(5, 10)),
          sb.arrival('STATION-2', clock(6, 16)))
        .build();
      dataUtils.initData(s);
      expect(dataUtils.howCanIGetTo("STATION-1", "STATION-2")).toEqual("FROMHERE");
    });
    it('Should find one transition', function() {
      var s = sb.state()
        .withStation(sb.station("STATION-1", 14.24444, 42.24242))
        .withStation(sb.station("STATION-2", 62.24444, 41.24242))
        .withStation(sb.station("STATION-3", 61.24444, 21.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', clock(5, 10)),
          sb.arrival('STATION-2', clock(6, 16)))
        .withTimetableEntry('TRAIN-2',
          sb.departure('STATION-2', clock(6, 20)),
          sb.arrival('STATION-3', clock(7, 16)))
        .build();
      dataUtils.initData(s);
      expect(dataUtils.howCanIGetTo("STATION-1", "STATION-3")[0]).toEqual("STATION-2");
    });
  });
});
