var _ = require('lodash');

function station(id, longitude, latitude) {
  return {
    stationShortCode: id,
    name: "Station " + id,
    latitude: latitude,
    longitude: longitude
  }
}

function departure(stationId) {
  return {
    stationShortCode: stationId,
    type: "DEPARTURE"
  }
}

function arrival(stationId) {
  return {
    stationShortCode: stationId,
    type: "ARRIVAL"
  }
}

function state() {
  var stuff = {
    stations: [],
    timetable: []
  };
  return {
      withStation: function(s) {
        var newStation = s;
        if(typeof s !== 'object') {
          newStation = station(s, 63.32323, 42.424242);
        }
        stuff.stations = _.concat(stuff.stations, newStation);
        return this;
      },
      withTimetableEntry: function(id) {

        stuff.timetable = _.concat(stuff.timetable,
          { trainId: id,
            timeTableRows: Array.prototype.slice.call(arguments).slice(1)});
        return this;
      },
      build: function() {
        return stuff;
      }
  };
}


describe("StateUtils", function() {

  var stateUtils = require('../src/StateUtils.js');

  describe("getStationById", function() {
    it("should throw if no station was found for id", function() {
      var s = state().build();
      expect(function() { stateUtils.getStationById(s, "STATIONID")}).toThrow(new Error("No such station: STATIONID"));
    });

    it("should return station with id", function() {
      var s = state().withStation("STATIONID").build();
      expect(stateUtils.getStationById(s, "STATIONID").stationShortCode).toEqual("STATIONID");
    });

    it("should return correct station with id", function() {
      var s = state().withStation("STATION-1").withStation("STATION-2").build();
      expect(stateUtils.getStationById(s, "STATION-2").stationShortCode).toEqual("STATION-2");
    });
  });

  describe("collectConnections", function() {
    it("Should collect connection between two stations", function() {
      var s = state()
        .withStation(station("ID-1", 14.24444, 42.24242))
        .withStation(station("ID-2", 43.42424, 13.2424))
        .withTimetableEntry("TRAIN-1",
            departure("ID-1"),
            arrival("ID-2"))
        .build();
      expect(stateUtils.collectConnections(s))
        .toEqual([{from: [14.24444, 42.24242], to: [43.42424, 13.2424]}]);
    });
    it("Should collect transitive connections between stations", function() {
      var s = state()
        .withStation(station("ID-1", 14.24444, 42.24242))
        .withStation(station("ID-2", 43.42424, 13.2424))
        .withStation(station("ID-3", 46.42424, 34.2424))
        .withTimetableEntry("TRAIN-1",
            departure("ID-1"),
            arrival("ID-2"),
            departure("ID-2"),
            arrival("ID-3"))
        .build();
      expect(stateUtils.collectConnections(s))
        .toEqual([{from: [14.24444, 42.24242], to: [43.42424, 13.2424]}, {from: [43.42424, 13.2424], to: [46.42424, 34.2424]}]);
    });
    it("Should pick connection only once for different routes", function() {
      var s = state()
        .withStation(station("ID-1", 14.24444, 42.24242))
        .withStation(station("ID-2", 43.42424, 13.2424))
        .withTimetableEntry("TRAIN-1",
            departure("ID-1"),
            arrival("ID-2"))
        .withTimetableEntry("TRAIN-2",
            departure("ID-1"),
            arrival("ID-2"))
        .build();

      expect(stateUtils.collectConnections(s).length).toEqual(1);
    });
    it("Should pick connection only once for opposite routes", function() {
      var s = state()
        .withStation(station("ID-1", 14.24444, 42.24242))
        .withStation(station("ID-2", 43.42424, 13.2424))
        .withTimetableEntry("TRAIN-1",
            departure("ID-1"),
            arrival("ID-2"))
        .withTimetableEntry("TRAIN-2",
            departure("ID-2"),
            arrival("ID-1"))
        .build();

      expect(stateUtils.collectConnections(s).length).toEqual(1);
    });
  });
});
