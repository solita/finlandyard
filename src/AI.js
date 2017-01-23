var dataUtils = require('./state/DataUtils.js');
var R = require('ramda');
var Actions = require('./Actions.js');

var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

var randomAI = (state, context, actor) => {


  var leavingTrains=dataUtils.trainsLeavingFrom(state.clockIs, actor.location);
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
  return Actions.train(train.trainNumber, chosenDestination);
}

var hunterAI = (state, context, actor) => {
  var leaving = dataUtils.trainsLeavingFrom(state.clockIs, actor.location);
  var huntthis = R.find((train) => R.contains(R.head(context.knownVillainLocations), dataUtils.getPossibleHoppingOffStations(train, actor.location)), leaving);
  if(R.isNil(huntthis)) {
    return Actions.idle();
  }
  return Actions.train(huntthis.trainNumber, R.head(context.knownVillainLocations));
}

var noopAI = (state, context, actor) => {
  return Actions.idle();
}

var prettyStupidVillain = (state, context, actor) => {

  if(R.contains(actor.location, context.policeDestinations)) {
    var train = dataUtils.nextLeavingTrain(state.clockIs, actor.location);
    if(!train) {
      return Actions.idle();
    }
    var possibleStops = dataUtils.getPossibleHoppingOffStations(train, actor.location);
    var hopOff = R.last(possibleStops);
    if(R.contains(hopOff,  context.policeDestinations) || R.contains(hopOff, context.knownPoliceLocations)) {
      hopOff = randomNth(R.tail(R.reverse(possibleStops)));
    }
    return Actions.train(train.trainNumber, hopOff);
  }

  return Actions.idle();
}

module.exports = {
  random: randomAI,
  noop: noopAI,
  hunter: hunterAI,
  villain: prettyStupidVillain
}
