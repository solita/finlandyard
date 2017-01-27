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

ActorBridge.registerActor('police', 'AAA', 'JNS', function(clockIs, context, actor) {
  console.log(context);
  // Get trains leaving from station
  var trainsLeavingArray = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  // Take first train
  //var train = R.head(trainsLeavingArray);
  var hopOffStation = "";
  for (var i=0; i<trainsLeavingArray.length; i++){
    var possibleDestinations = dataUtils.getPossibleHoppingOffStations(trainsLeavingArray[i], actor.location);
    for (var j=0; j<possibleDestinations.length; j++){
      for (var k=0; k<context.knownVillainLocations.length; k++){
        if(context.knownVillainLocations[k]==possibleDestinations[j]){
          return Actions.train(trainsLeavingArray[i], possibleDestinations[j]);
        }
      }
    }
  }
  var randTRAIN = randomNth(trainsLeavingArray);
  var dest = randomNth(dataUtils.getPossibleHoppingOffStations(randTRAIN, actor.location));
  // Take last station from train
  //var hopOffStation = R.last(dataUtils.getPossibleHoppingOffStations(train, actor.location));
  // Hop to first train and got to the last station
  return Actions.train(randTRAIN, dest);
});
