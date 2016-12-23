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
  stationCoordinates: function(state, id) {
    var coords = R.juxt([R.prop('longitude'), R.prop('latitude')]);
    // Wat?
    return coords(module.exports.getStationById(state, id));
  },
  collectConnections: function(state) {
    // Partial for accessing coordinates from state
    var coordsById = R.partial(this.stationCoordinates, [state]);

    var timeTableRows = R.compose(
      // Map coordinates to stations
      R.map(R.evolve({from: coordsById, to: coordsById})),
      R.map((con) => {
        return {from: R.head(con), to: R.last(con)}
      }),

      // Reduce all unique connections, unique is MUCH faster with strings, hence R.join
      R.uniqBy(R.compose(R.join('-'), R.sortBy(R.identity))),

      // We know its [DEPARTURE, ARRIVAL, DEPARTURE, ARRVIVAL...]
      // So we get collection of tuples [[HKI, PSL], [PSL, LKJ] ...]
      R.splitEvery(2),

      // Map every station id from routes: [HKI, PSL, PSL, LKJ, LKJ, JEK, JEK ....]
      R.map(R.prop('stationShortCode')),
      R.flatten,
      R.map(R.prop('timeTableRows')));

    return timeTableRows(state.timetable);
  },
  connectedStations: function(state) {
    var allConnectedStations =
      _.flatten(_.map(state.timetable,
        function(t) { return _.map(t.timeTableRows, "stationShortCode"); }));

    return _.map(_.uniq(allConnectedStations), _.partial(module.exports.getStationById, state));
  }
}
