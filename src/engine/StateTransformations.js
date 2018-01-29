import R from 'ramda';
import dataUtils from'../state/DataUtils.js';
import CommonUtils from '../state/CommonUtils.js';
import moment from 'moment';
import log from '../utils/Log.js';

const isInBetween = (timestamp, e) => {
  return e[0].scheduledTime.isBefore(timestamp) && timestamp.isBefore(e[1].scheduledTime);
}

function getTrainLocationCoordinated(state, train) {

  // Find the gap train is between in currently
  var d = R.find(
    R.partial(isInBetween, [state.clockIs]),
    R.splitEvery(2, train.timeTableRows));

  if(R.isNil(d)) {
    // This is the situation where actor is marked to be in train
    // but train is not currently moving
    // console.log("Train missing! " + state.clockIs.asString());
    return null;
  }
  // Calculate the coordinated train is at in given time
  var departure_station = dataUtils.getStationById(R.head(d).stationShortCode);
  var arrival_station =  dataUtils.getStationById(R.last(d).stationShortCode);
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
    var station = dataUtils.getStationById(actor.location);
    actor = R.merge(actor, {latitude: station.latitude, longitude: station.longitude});

  } else if(actor.train) {
    var actorTrain = dataUtils.getTrainById(actor.train);

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
  calculateNewPositions: function(state) {
    return R.evolve({actors: R.map(R.partial(calculatePosition, [state]))}, state);
  },
  applyStateChanges: function(state) {
    var policesAreInCitiesAll = R.compose(
        R.reject(R.propEq('location', null)),
        R.filter(R.propEq('type', 'police'))
    )(state.actors);

    var policesAreInTrainsAll = R.compose(
        R.filter(R.propEq('location', null)),
        R.filter(R.propEq('type', 'police'))
    )(state.actors);

    var policeLocationInCities = R.map(R.prop('location'))(policesAreInCitiesAll);

    var policeLocationInTrains= R.map(R.prop('train'))(policesAreInTrainsAll);

    state.actors = R.map(actor => {
      if(R.propEq('type', 'villain', actor) &&
        (R.contains(actor.location, policeLocationInCities) || R.contains(actor.train, policeLocationInTrains) )) {
        if(!actor.caught) {
          var policeCity=R.filter(R.propEq('location', actor.location))(policesAreInCitiesAll);
          var policeTrain=R.filter(R.propEq('train', actor.train))(policesAreInTrainsAll);
          var police=policeCity.concat(policeTrain);
          if(!police[0].stats) {
            police[0].stats=0
          }
          police[0].stats++;

         console.log(actor.name +" got caught by " + police[0].name + "!");
        }
        return R.assoc('caught', true, actor);
      }
      if(!actor.caught) {
        return R.evolve({'freeMinutes': R.inc}, actor);
      }
      return actor;
    }, state.actors);


    state.actors = R.map(actor => {
      if(actor.train) {
        var actorTrain = dataUtils.getTrainById(actor.train);
        // Actor has scheduleEntryToMomentcted train but is waiting for it
        if(actor.location &&
           state.clockIs.isSame(dataUtils.findTrainDeparture(dataUtils.getTrainById(actor.train), actor.location).scheduledTime)) {
          var station = dataUtils.getStationById(actor.location);
          log.log(state.clockIs, actor.name + ' departs from ' + actor.location);
          return R.merge(actor, {location: null});
        }
        // Actor is in train and waiting for arrival
        if(!actor.location &&
           state.clockIs.isSame(dataUtils.findTrainArrival(dataUtils.getTrainById(actor.train), actor.destination).scheduledTime)) {
           var station = dataUtils.getStationById(actor.destination);
           log.log(state.clockIs, actor.name + ' arrives tos ' + actor.destination);
          return R.merge(actor, {location: actor.destination, destination: null, train: null});
        }
      }
      return actor;
    }, state.actors);


    return state;
  },
  applyRound: function(state) {
    return this.calculateNewPositions(this.applyStateChanges(state));
  }
}
