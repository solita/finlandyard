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

ActorBridge.registerActor('police', 'betteryellow', 'JNS', function(clockIs, context, actor) {
  console.log(context);
  // Get trains leaving from station
  var trainsLeavingArray = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  var villainLocation = context.knownVillainLocations;
  for (var i  = 0; i < trainsLeavingArray.length; i++) {
    var train = trainsLeavingArray[i];
    var stations = dataUtils.getPossibleHoppingOffStations(train, actor.location);
    for (var j = 0; j < stations.length; j++) {
      var station = stations[j];
      for (var k = 0; k < villainLocation.length; k++) {
        var vilLoc = villainLocation[k];
        if (station == vilLoc) {
          console.log(train, station);
          return Actions.train(train, station);
        }
      }
    }
  }
  var train = train(randomNth(trainsLeavingFrom));
  var loc = R.head(dataUtils.getPossibleHoppingOffStations(train, actor.location))
  return Actions.train(train, loc)
});
