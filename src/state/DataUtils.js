'use strict';
var R = require('ramda');
var moment = require('moment');

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
    return coords(module.exports.getStationById(state, id));
  },
  trainsLeavingFrom: function(state, stationShortCode) {
    return R.filter(
      R.compose(
        (a) => {
          var v = R.find(R.propEq('stationShortCode', stationShortCode), a);
          if(R.isNil(v)) {
            return false;
          }
          return state.clockIs.unix() < v.scheduledTime.unix();
        },
        R.filter(R.propEq('type', 'DEPARTURE')),
        R.prop('timeTableRows')),
      state.timetable)
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
    if(R.isNil(state.timetable)) {
      return [];
    }
    var collector = R.compose(
      R.map(R.partial(module.exports.getStationById, [state])),
      R.uniqBy(R.identity),
      R.map(R.prop('stationShortCode')),
      R.flatten,
      R.map(R.prop('timeTableRows'))
    );
    return collector(state.timetable);
  }
}
