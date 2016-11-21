var _ = require('lodash');

function station(id) {
  return {
    stationShortCode: id,
    name: "Station " + id
    // At this stage, not coordinates
  }
}

function state() {
  var stuff = {
    stations: []
  }
  return {
      withStation: function(s) {
        var newStation = s;
        if(typeof s !== 'object') {
          newStation = station(s);
        }
        stuff.stations = _.concat(stuff.stations, newStation);
        return this;
      },
      build: function() {
        return stuff;
      }
  }

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

});
