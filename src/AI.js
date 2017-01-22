var dataUtils = require('./state/DataUtils.js');
var R = require('ramda');
var Actions = require('./Actions.js');

var randomAI = (state, context, actor) => {
  var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

  var leavingTrains=dataUtils.trainsLeavingFrom(state, actor.location);
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
  console.log(context);
  var leaving = dataUtils.trainsLeavingFrom(state, actor.location);
  var huntthis = R.find((train) => R.contains(R.head(context.knownVillainLocations), dataUtils.getPossibleHoppingOffStations(train, actor.location)), leaving);
  if(R.isNil(huntthis)) {
    return Actions.idle();
  }
  return Actions.train(huntthis.trainNumber, R.head(context.knownVillainLocations));
}

var noopAI = (state, context, actor) => {
  return Actions.idle();
}

module.exports = {
  random: randomAI,
  noop: noopAI,
  hunter: hunterAI
}
