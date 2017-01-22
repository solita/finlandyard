'use strict';

var _ = require('lodash');
var moment = require('moment');

function station(id, longitude, latitude) {
  return {
    stationShortCode: id,
    name: "Station " + id,
    latitude: latitude || 63.32323,
    longitude: longitude || 42.424242
  }
}

function departure(stationId, scheduledTime) {
  if(!scheduledTime) {
    scheduledTime = moment();
  }
  return {
    stationShortCode: stationId,
    type: "DEPARTURE",
    scheduledTime: scheduledTime
  }
}

function arrival(stationId, scheduledTime) {
  if(!scheduledTime) {
    scheduledTime = moment();
  }
  return {
    stationShortCode: stationId,
    type: "ARRIVAL",
    scheduledTime: scheduledTime
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
          { trainNumber: id,
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
