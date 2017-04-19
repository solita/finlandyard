var dataUtils = require('./state/DataUtils.js');
var R = require('ramda');
var Actions = require('./Actions.js');
var Dijkstra = require('./Dijkstra.js');

var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

const routeMap={}

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

const dijkstraAI=(clockIs, context, actor) => {
  console.log(actor.name)
  var routeObj = routeMap[actor.name];
  if(!routeObj || routeObj.route.length ==0) {
    var from=actor.location;
    var villainInd=Math.floor(Math.random()*(context.knownVillainLocations.length-1));
    var to=context.knownVillainLocations[villainInd]
    if(from == to) {
      return Actions.idle()
    }
    var dijsktraRes = Dijkstra.run(clockIs, from, to);
    routeObj={actor:actor.name, route: dijsktraRes}
    routeMap[actor.name] = routeObj;
  }
  var from=actor.location;
  var nextDestination=routeObj.route[0]
  routeObj.route.shift()
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
