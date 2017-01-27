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

ActorBridge.registerActor('police', 'Blue_AIM', 'JNS', function(clockIs, context, actor) {
  console.log(clockIs, context, actor);
  // Get trains leaving from station
  var trainsLeavingArray = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  // Take first train
  var train = R.head(trainsLeavingArray);
  console.log("train",train);
  // Take last station from train
  var hopOffStation;
  var knownVillainLocations=context.knownVillainLocations.some(villain=>{
    var possibleDestinationsArray = dataUtils.getPossibleHoppingOffStations(train, actor.location).indexOf(villain);
    console.log(villain,possibleDestinationsArray);
    if(!!~possibleDestinationsArray){
      hopOffStation=villain;
      return true;
    }else return false;
  });
  if(hopOffStation) hopOffStation = R.last(dataUtils.getPossibleHoppingOffStations(train, actor.location));
  console.log("station", hopOffStation);
  // Hop to first train and got to the last station
  return Actions.train(train, hopOffStation);
});
