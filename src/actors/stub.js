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

var lastStation = false;

// Utility for returning random entry from array  randomNth([1, 2, 3]) -> 2
var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

ActorBridge.registerActor('police', 'Kilonpoliisi', 'JNS', function(clockIs, context, actor) {
  console.log(context);
  // Get trains leaving from station
  var trainsLeavingArray = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  var villains = context.knownVillainLocations;
  // Take first train
  var train = R.head(trainsLeavingArray);
  // Take last station from train

  var hopOffStation = false

  for (var k = 0; k < trainsLeavingArray.length; k++) {
    for(var i = 0; i < villains.length; i++ ) {
     for(var j = 0; j < dataUtils.getPossibleHoppingOffStations(trainsLeavingArray[k], actor.location).length; j++ ) {
      if (!hopOffStation && dataUtils.getPossibleHoppingOffStations(trainsLeavingArray[k], actor.location)[j] == villains[i])
      {
        hopOffStation = villains[i];
        train = trainsLeavingArray[k];
      }
     }
    }
  }

  var mostTrains = 0;
  if (!hopOffStation){
    for (var k = 0; k < trainsLeavingArray.length; k++) {
      for (var i = 0; i < dataUtils.getPossibleHoppingOffStations(trainsLeavingArray[k], actor.location).length; i++) {
         if (dataUtils.trainsLeavingFrom(clockIs, dataUtils.getPossibleHoppingOffStations(trainsLeavingArray[k], actor.location)[i]).length > mostTrains) {
           hopOffStation = dataUtils.getPossibleHoppingOffStations(trainsLeavingArray[k], actor.location)[i];
           train = trainsLeavingArray[k];
           mostTrains = dataUtils.trainsLeavingFrom(clockIs, dataUtils.getPossibleHoppingOffStations(trainsLeavingArray[k], actor.location)[i]).length;
         }
      }
    }
  }

  if (!hopOffStation){
    hopOffStation = R.last(dataUtils.getPossibleHoppingOffStations(train, actor.location));
  }

  lastStation = hopOffStation;
  // Hop to first train and got to the last station
  return Actions.train(train, hopOffStation);
});
