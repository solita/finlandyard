'use strict';
var _ = require('lodash');
var R = require('ramda');

var throwIfNull = (message, value) =>
  R.ifElse(
    R.isNil,
    (_) => { throw Error(message)},
    R.identity
  )(value);

module.exports = {
  getStationById: function(state, id) {
    return throwIfNull(
      R.concat("No such station: ", id),
      R.find(R.propEq('stationShortCode', id), state.stations));
  },
  getTrainById(state, id) {
    return throwIfNull(
      R.concat("No such train: ", id),
      R.find(R.propEq('trainNumber', id), state.timetable));
  },
  collectConnections: function(state) {
    // Collect every connection
    var allConnections = _.flatten(_.map(state.timetable, function(t) { return t.timeTableRows; })),

    // Map connections with station coordinates
    allConnections = _.map(allConnections, function(entry) {
      var station = module.exports.getStationById(state, entry.stationShortCode);
      return {
        stationShortCode: entry.stationShortCode,
        coords: [station.longitude, station.latitude]
      }
    });

    // Remove duplicates
    allConnections = _.map(_.chunk(allConnections, 2), function(connection) {
      var si = _.join(_.sortBy([connection[0].stationShortCode, connection[1].stationShortCode]), "");
      return {sortIdentifier: si, from: connection[0].coords, to: connection[1].coords};
    });

    // Remove util data
    return _.map(_.uniqBy(allConnections, "sortIdentifier"), function(e) { return _.omit(e, "sortIdentifier");});
  },
  connectedStations: function(state) {
    var allConnectedStations =
      _.flatten(_.map(state.timetable,
        function(t) { return _.map(t.timeTableRows, "stationShortCode"); }));

    return _.map(_.uniq(allConnectedStations), _.partial(module.exports.getStationById, state));
  }
}
