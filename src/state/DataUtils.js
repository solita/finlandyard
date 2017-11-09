'use strict';
var R = require('ramda');
var moment = require('moment');

var throwIfNull = (message, value) =>
  R.ifElse(
    R.isNil,
    (_) => { throw Error(message)},
    R.identity
  )(value);

// Drops until from sequence until fn is truthy. First truthy element is also dropped!
var dropUntil = (fn, coll) =>
  R.reduce((acc, value) => {
    if(fn(value)) {
      return R.reduced(R.tail(acc));
    } else {
      return R.tail(acc);
    }
  }, coll, coll);

var state = {};

var stationConnections = {};

module.exports = {
  initData: function(data) {
    state = data;
    state.timetable.map(function(train) {
      var x = R.reduce((acc, departure) => {
        return R.assoc(departure.stationShortCode, module.exports.getPossibleHoppingOffStations(train, departure.stationShortCode), acc);
      }, {},  R.filter(R.propEq('type', 'DEPARTURE'), train.timeTableRows));
      R.forEach((key) => {
        if(stationConnections[key]) {
          stationConnections[key] = R.uniq(R.concat(stationConnections[key], R.prop(key, x)));
        } else {
          stationConnections[key] = R.prop(key, x);
        }
      }, R.keys(x));
    });
  },
  howCanIGetTo: function(from, to) {
    var possibleDestinations = R.prop(from, stationConnections);
    if(R.contains(to, possibleDestinations)) {
      return "FROMHERE";
    }
    var viaList = [];
    for(var i = 0; i < possibleDestinations.length; i++) {
      var destination = possibleDestinations[i];
      if(R.prop(destination, stationConnections) && R.contains(to, R.prop(destination, stationConnections))) {
        viaList.push(destination);
      }
    }
    return viaList;
  },
  getStationById: R.memoize(function(id) {
    return throwIfNull(
      R.concat("No such station: ", id),
      R.find(R.propEq('stationShortCode', id), state.stations));
  }),
  getTrainById: R.memoize(function(id) {
    return throwIfNull(
      R.concat("No such train: ", id),
      R.find(R.propEq('trainNumber', id), state.timetable));
  }),
  assertAction(action) {
    return R.contains(action.destination, R.map(R.prop('stationShortCode'), this.getTrainById(action.trainNumber).timeTableRows));
  },
  stationCoordinates: function(id) {
    var coords = R.juxt([R.prop('longitude'), R.prop('latitude')]);
    return coords(module.exports.getStationById(id));
  },
  findTrainDeparture: function(train, location) {
    return R.find(R.allPass([R.propEq('stationShortCode', location), R.propEq('type', 'DEPARTURE')]), train.timeTableRows);
  },
  findTrainArrival: function(train, location) {
    return R.find(R.allPass([R.propEq('stationShortCode', location), R.propEq('type', 'ARRIVAL')]), train.timeTableRows);
  },
  trainsLeavingFrom: function(clockIs, stationShortCode) {

    var x = R.filter(
      R.compose(
        (a) => {
          var v = R.find(R.propEq('stationShortCode', stationShortCode), a);
          if(R.isNil(v)) {
            return false;
          }
          return clockIs.isBefore(v.scheduledTime);
        },
        R.filter(R.propEq('type', 'DEPARTURE')),
        R.prop('timeTableRows')),
      state.timetable);

      return x;
  },
  getPossibleHoppingOffStations: function(train, actorLocation) {
    return R.map(R.prop('stationShortCode'), R.filter(
      R.allPass([R.propEq('trainStopping', true), R.propEq('type', 'ARRIVAL')]),
      dropUntil(R.propEq('stationShortCode', actorLocation), train.timeTableRows)));
  },
  connectionCountFromStation: function(stationShortCode) {
    return R.filter(
      R.compose(
        (a) => {
          var v = R.find(R.propEq('stationShortCode', stationShortCode), a);
          return !R.isNil(v);
        },
        R.filter(R.propEq('type', 'DEPARTURE')),
        R.prop('timeTableRows')),
      state.timetable).length;
  },
  nextLeavingTrain: function(clockIs, location) {
    var trains = this.trainsLeavingFrom(clockIs, location);
    return R.reduce((currentlyNext, train) => {
      if(this.findTrainDeparture(train, location).scheduledTime.unix() < this.findTrainDeparture(currentlyNext, location).scheduledTime.unix()) {
        return train;
      }
      return currentlyNext;
    }, R.head(trains), R.tail(trains));
  },

  collectConnections: function() {
    // Partial for accessing coordinates from state
    var coordsById = R.partial(this.stationCoordinates, []);

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
  connectedStations: function() {
    if(R.isNil(state.timetable)) {
      return [];
    }
    var collector = R.compose(
      R.map(R.partial(module.exports.getStationById, [])),
      R.uniqBy(R.identity),
      R.map(R.prop('stationShortCode')),
      R.flatten,
      R.map(R.prop('timeTableRows'))
    );
    return collector(state.timetable);
  }
}
