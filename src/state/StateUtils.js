'use strict';

var R = require('ramda');
var dataUtils = require('./DataUtils.js');
var moment = require('moment');

var isInBetween = (timestamp, e) => {
  return moment(e[0].scheduledTime).unix() <= timestamp && timestamp <= moment(e[1].scheduledTime).unix();
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
  var leaving = moment(R.head(d).scheduledTime).unix();
  var arriving = moment(R.last(d).scheduledTime).unix();

  var porpotion = (arriving - state.clockIs.unix()) / (arriving - leaving);

  return {
    latitude: arrival_station.latitude + porpotion * (departure_station.latitude - arrival_station.latitude),
    longitude: arrival_station.longitude + porpotion * (departure_station.longitude - arrival_station.longitude),
    // Location MUST be null if actor is in train
    location: null
  };

}

function calculatePosition(state, actor) {
  if(actor.train) {
    var actorTrain = dataUtils.getTrainById(state, actor.train);

    // Train has not yet departed
    if(state.clockIs.unix() < moment(R.head(actorTrain.timeTableRows).scheduledTime).unix()) {
      var station = dataUtils.getStationById(state, actor.location);
      return R.merge(actor, {latitude: station.latitude, longitude: station.longitude});
    }
    // Train has arrived
    if(state.clockIs.unix() > moment(R.last(actorTrain.timeTableRows).scheduledTime).unix()) {
      return R.merge(actor, {train: null, location: R.last(actorTrain.timeTableRows).stationShortCode});
    }
    // Train is somewhere along the route
    var trainLocation = getTrainLocationCoordinated(state, actorTrain);
    if(!R.isNil(trainLocation)) {
      return R.merge(actor, trainLocation);
    }

    return actor;
  }
  var station = dataUtils.getStationById(state, actor.location);
  return R.merge(actor, {latitude: station.latitude, longitude: station.longitude});

}

module.exports = {
  getActors: function(state, type) {
    return R.filter(R.propEq('type', type), state.actors);
  },
  calculateNewPositions: function(state) {
    return R.evolve({actors: R.map(R.partial(calculatePosition, [state]))}, state);
  }
}
