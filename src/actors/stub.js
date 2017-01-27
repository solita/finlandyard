var ActorBridge = require('../ActorBridge.js');
var dataUtils = require('../state/DataUtils.js');
var R = require('ramda');
var Actions = require('../Actions.js');
var _ = require('lodash');

// Utils
/*
  R.head(array)
  R.last(array)
  .. and so on
*/

// Utility for returning random entry from array  randomNth([1, 2, 3]) -> 2
var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

ActorBridge.registerActor('police', 'sauna-lovers', 'JNS', function(clockIs, context, actor) {
  console.log(context);

  var villainLocation = R.last(context.knownVillainLocations);
  // Get trains leaving from station
  var trainsLeavingArray = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  var ctrain;
  ctrain = chooseTrain(villainLocation);
  if (!ctrain) {
    villainLocation = 'HKI'
    ctrain = chooseTrain('HKI');
  }
  function chooseTrain(loc) {
  for (var train of trainsLeavingArray) {
    var possibleDestinationsArray = dataUtils.getPossibleHoppingOffStations(train, actor.location);
    if (_.includes(possibleDestinationsArray, loc)) {
      return train;
      break;
    }
  }
  }
  // Take first train
  // Take last station from train
  // Hop to first train and got to the last station
  return Actions.train(ctrain, villainLocation);
});
