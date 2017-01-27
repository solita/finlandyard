var ActorBridge = require('../ActorBridge.js');
var dataUtils = require('../state/DataUtils.js');
var R = require('ramda');
var Actions = require('../Actions.js');

// Utils
/*
  R.head(array)
  R.last(array)
  .. and so on
*/

// Utility for returning random entry from array  randomNth([1, 2, 3]) -> 2
var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

ActorBridge.registerActor('police', 'stub', 'JNS', function(clockIs, context, actor) {
  console.log(context);
  // Get trains leaving from station
  var trainsLeavingArray = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  // Take first train
  var train = R.head(trainsLeavingArray);
  // Take last station from train
  var hopOffStation = R.last(dataUtils.getPossibleHoppingOffStations(train, actor.location));
  // Hop to first train and got to the last station
  return Actions.train(train, hopOffStation);
});
