var dataUtils = require('./state/DataUtils.js');
var R = require('ramda');
var Actions = require('./Actions.js');
var Dijkstra = require('./Dijkstra.js');

var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

var route=null;

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
  if(!route || route.length ==0) {
    var from=actor.location;
    var to=context.knownVillainLocations[0]
    if(from == to) {
      return Actions.idle()
    }
    route=Dijkstra.run(clockIs, from, to)
    debugger;
  }
  var from=actor.location;
  var nextDestination=route[0]
  route.shift()
  if(from==to) {
    return Actions.idle();
  }
  if(!nextDestination) {
    return Actions.idle()
  }
  var train=dataUtils.getTrainById(nextDestination.trainNumber)
  if(train == null) {
    return Actions.idle();
  }
  return Actions.train(train, nextDestination.name)



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
  villain: prettyStupidVillain,
  dijkstra: dijkstraAI
}
