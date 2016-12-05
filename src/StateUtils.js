'use strict';
var _ = require('lodash');
var dataUtils = require('./DataUtils.js');
var moment = require('moment');

function getTrainLocation(state, train) {
  var timestamp = state.clockIs.unix();
  var c = _.chunk(train.timeTableRows, 2);
  var d = _.find(c, function(e) {
    return moment(e[0].scheduledTime).unix() <= timestamp && timestamp <= moment(e[1].scheduledTime).unix();
  });

  if(d) {
    var departure_station = dataUtils.getStationById(state, d[0].stationShortCode);
    var arrival_station =  dataUtils.getStationById(state, d[1].stationShortCode);
    var leaving = moment(d[0].scheduledTime).unix();
    var arriving = moment(d[1].scheduledTime).unix();

    var porpotion = (arriving - timestamp) / (arriving - leaving);

    return {
      latitude: arrival_station.latitude + porpotion * (departure_station.latitude - arrival_station.latitude),
      longitude: arrival_station.longitude + porpotion * (departure_station.longitude - arrival_station.longitude)
    };
  }

  return null;
}

function calculatePosition(state, actor) {
  if(actor.train) {
    var trainLocation = getTrainLocation(state, dataUtils.getTrainById(state, actor.train));
    if(trainLocation) {
      return _.assign(actor, trainLocation);
    }
    return actor;
  }
  var station = dataUtils.getStationById(state, actor.location);
  return _.assign(actor, {latitude: station.latitude, longitude: station.longitude});

}

module.exports = {
  getActors: function(state, type) {
    return _.filter(state.actors, function(actor) { return actor.type === type; } );
  },
  calculateNewPositions: function(state) {
    return _.assign(state, {actors: _.map(state.actors, _.partial(calculatePosition, state))});
  }
}
