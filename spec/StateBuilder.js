var _ = require('lodash');

function station(id, longitude, latitude) {
  return {
    stationShortCode: id,
    name: "Station " + id,
    latitude: latitude || 63.32323,
    longitude: longitude || 42.424242
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
      withStation: function(newStation) {
        stuff.stations = _.concat(stuff.stations, newStation);
        return this;
      },
      withTimetableEntry:function(id) {
        stuff.timetable = _.concat(stuff.timetable,
          { trainId: id,
            timeTableRows: Array.prototype.slice.call(arguments).slice(1)
          });
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
