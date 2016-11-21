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

module.exports = {
  state: state,
  arrival: arrival,
  departure: departure,
  station: station
}
