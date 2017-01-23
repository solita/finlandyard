'use strict';

var R = require('ramda');
var dataUtils = require('./DataUtils.js');
var moment = require('moment');
var log = require('../Log.js');

var isInBetween = (timestamp, e) => {
  return e[0].scheduledTime.unix() <= timestamp && timestamp <= e[1].scheduledTime.unix();
}

function getTrainLocationCoordinated(state, train) {
  // Find the gap train is between in currently
  var d = R.find(
    R.partial(isInBetween, [state.clockIs.unix()]),
    R.splitEvery(2, train.timeTableRows));

  if(R.isNil(d)) {
    // This is the situation where actor is marked to be in train
    // but train is not currently moving
    return null;
  }
  // Calculate the coordinated train is at in given time
  var departure_station = dataUtils.getStationById(state, R.head(d).stationShortCode);
  var arrival_station =  dataUtils.getStationById(state, R.last(d).stationShortCode);
  var leaving = R.head(d).scheduledTime.unix();
  var arriving = R.last(d).scheduledTime.unix();

  var porpotion = (arriving - state.clockIs.unix()) / (arriving - leaving);

  return {
    latitude: arrival_station.latitude + porpotion * (departure_station.latitude - arrival_station.latitude),
    longitude: arrival_station.longitude + porpotion * (departure_station.longitude - arrival_station.longitude),
    // Location MUST be null if actor is in train
    location: null
  };

}

function calculatePosition(state, actor) {
  if(actor.caught) {
    return actor;
  }
  if(actor.location) {
    // If actor is in location, this should NEVER be rewritten
    var station = dataUtils.getStationById(state, actor.location);
    actor = R.merge(actor, {latitude: station.latitude, longitude: station.longitude});

  } else if(actor.train) {
    var actorTrain = dataUtils.getTrainById(state, actor.train);

    // Train is somewhere along the route
    var trainLocation = getTrainLocationCoordinated(state, actorTrain);
    if(!R.isNil(trainLocation)) {
      return R.merge(actor, trainLocation);
    }

    return actor;
  }

  return actor;

}

module.exports = {
  getActors: function(state, type) {
    var result=R.filter(R.propEq('type', type), state.actors);
    return result;
  },
  applyStateChanges: function(state) {

    var policesAreInCities = R.compose(
      R.map(R.prop('location')),
      R.reject(R.propEq('location', null)),
      R.filter(R.propEq('type', 'police'))
    )(state.actors);

    var policesAreInTrains = R.compose(
      R.map(R.prop('train')),
      R.filter(R.propEq('location', null)),
      R.filter(R.propEq('type', 'police'))
    )(state.actors);

    state.actors = R.map(actor => {
      if(R.propEq('type', 'villain', actor) &&
        (R.contains(actor.location, policesAreInCities) || R.contains(actor.train, policesAreInTrains) )) {
        return R.assoc('caught', true, actor);
      }
      if(!actor.caught) {
        return R.evolve({'freeMinutes': R.inc}, actor);
      }
      return actor;
    }, state.actors);


    state.actors = R.map(actor => {
      if(actor.train) {
        var actorTrain = dataUtils.getTrainById(state, actor.train);
        // Actor has selected train but is waiting for it
        if(actor.location &&
           state.clockIs.unix() > R.find(R.propEq('stationShortCode', actor.location), actorTrain.timeTableRows).scheduledTime.unix()) {
          var station = dataUtils.getStationById(state, actor.location);
          log.log(state.clockIs, actor.name + ' departs from ' + station.stationName);
          return R.merge(actor, {location: null});
        }
        // Actor is in train and waiting for arrival
        if(!actor.location &&
           state.clockIs.unix() > R.find(R.propEq('stationShortCode', actor.destination), actorTrain.timeTableRows).scheduledTime.unix()) {
           var station = dataUtils.getStationById(state, actor.destination);
           log.log(state.clockIs, actor.name + ' arrives tos ' + station.stationName);
          return R.merge(actor, {location: actor.destination, destination: null, train: null});
        }
      }
      return actor;
    }, state.actors);


    return state;
  },
  calculateNewPositions: function(state) {
    return R.evolve({actors: R.map(R.partial(calculatePosition, [state]))}, state);
  },
  gameOver: function(state) {
    return R.all(R.propEq('caught', true), this.getActors(state, 'villain'));
  }
}
