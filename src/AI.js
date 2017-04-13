var dataUtils = require('./state/DataUtils.js');
var R = require('ramda');
var Actions = require('./Actions.js');
var Dijkstra = require('./Dijkstra.js');

var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

var randomAI = (clockIs, context, actor) => {

  var leavingTrains=dataUtils.trainsLeavingFrom(clockIs, actor.location);
  if(leavingTrains.length == 0) {
      return Actions.idle();
  }

  var train = randomNth(leavingTrains);
  if(R.isNil(train)) {
      return Actions.idle();
  }

  var chosenDestination = randomNth(dataUtils.getPossibleHoppingOffStations(train, actor.location));
  if(R.isNil(chosenDestination)) {
      return Actions.idle();
  }
  return Actions.train(train, chosenDestination);
}

var dijkstraAI=(clockIs, context, actor) => {

}

var noopAI = (clockIs, context, actor) => {
  return Actions.idle();
}

var prettyStupidVillain = (clockIs, context, actor) => {

  if(R.contains(actor.location, context.policeDestinations)) {
    var train = dataUtils.nextLeavingTrain(clockIs, actor.location);
    if(!train) {
      return Actions.idle();
    }
    var possibleStops = dataUtils.getPossibleHoppingOffStations(train, actor.location);
    var hopOff = R.last(possibleStops);
    if(R.contains(hopOff,  context.policeDestinations) || R.contains(hopOff, context.knownPoliceLocations)) {
      hopOff = randomNth(R.reverse(possibleStops));
    }
    return Actions.train(train, hopOff);
  }

  return Actions.idle();
}

module.exports = {
  random: randomAI,
  noop: noopAI,
  villain: prettyStupidVillain
}
