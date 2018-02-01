import R from 'ramda'
import Actions from '../engine/Actions.js'
import ActorBridge from '../ActorBridge.js'
import dataUtils from '../state/DataUtils.js'
import {log} from '../utils/Log';

ActorBridge.registerActor('police', 'sipowitch', 'JNS', function(clockIs, context, actor) {
  var leaving = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  var train = null;
  var destination = null;
  var timeToGetThere = null;
  for(var i = 0; i < leaving.length; i++) {
    var possibleTrain = leaving[i];
    var possibleHops = dataUtils.getPossibleHoppingOffStations(possibleTrain, actor.location);
    for(var a = 0; a < context.knownVillainLocations.length; a++) {
      var villainLocation = context.knownVillainLocations[a];
      if( R.contains(villainLocation, possibleHops)) {
        var arrival = dataUtils.findTrainArrival(possibleTrain, villainLocation).scheduledTime;
        if(!timeToGetThere || timeToGetThere.isBefore(arrival)) {
          train = possibleTrain;
          destination = villainLocation;
          timeToGetThere = arrival;
        }
      }
    }
  }

  if(!R.isNil(train)) {
    const status = actor.type === 'police' ? 'enemy' : 'neutral'
    log(actor.name +" leaving from " + actor.location + " to " + destination + ", departure: " +
        dataUtils.findTrainArrival(train, destination).scheduledTime.asString(), status);
    return Actions.train(train, destination);
  }

  log("Retreating...", "enemy");
  var retreatingTo = null;
  var usingTrain = null;
  for(var i = 0; i < leaving.length; i++) {
    var possibleTrain = leaving[i];
    var hops = dataUtils.getPossibleHoppingOffStations(possibleTrain, actor.location);
    if(R.contains('HKI', hops)) {
        retreatingTo = 'HKI';
        usingTrain = possibleTrain;
        break;
    }
    if(R.contains('JNS', hops)) {
        retreatingTo = 'JNS';
        usingTrain = possibleTrain;
        break;
    }
    if(R.contains('TKU', hops)) {
        retreatingTo = 'TKU';
        usingTrain = possibleTrain;
        break;
    }
    if(R.contains('TPE', hops)) {
        retreatingTo = 'TPE';
        usingTrain = possibleTrain;
        break;
    }
    if(R.contains('OUL', hops)) {
        retreatingTo = 'TPE';
        usingTrain = possibleTrain;
        break;
    }
  }
  if(retreatingTo && usingTrain) {
    log('Retreating to ' + retreatingTo, "enemy");
    return Actions.train(usingTrain, retreatingTo);
  }
  log("I'm stuck, I'll just hop to first train", "enemy");
  var train = dataUtils.nextLeavingTrain(clockIs, actor.location);
  if(!train) {
    log("No trains leaving... " + clockIs.asString(), "enemy");
    return Actions.idle();
  }
  var possibleStops = dataUtils.getPossibleHoppingOffStations(train, actor.location);
  var hopOff = R.last(possibleStops);
  log("It's going to " + hopOff + ' at ' + dataUtils.findTrainArrival(train, hopOff).scheduledTime.asString(), "enemy");
  return Actions.train(train, hopOff);
});
