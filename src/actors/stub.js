var ActorBridge = require('../ActorBridge.js');
var dataUtils = require('../state/DataUtils.js');
var R = require('ramda');
var Actions = require('../Actions.js');

// Utils
/*
  R.first(array)
  R.last(array)
  .. and so on
*/

ActorBridge.registerActor('police', 'stub', 'JNS', function(clockIs, context, actor) {
  console.log(context);
  // Get trains leaving from station
  var trainsLeavingArray = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  // Hop to first train and got to the last station
  return Actions.train(u[0], R.last(dataUtils.getPossibleHoppingOffStations(u[0], actor.location)))
});
