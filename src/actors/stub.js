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

ActorBridge.registerActor('police', 'robocop', 'JNS', function(clockIs, context, actor) {
  console.log(context);
  var villains = context.knownVillainLocations;
  var location = actor.location;




  // Get trains leaving from station
  var trainsLeavingArray = dataUtils.trainsLeavingFrom(clockIs, actor.location);

  var train_t = -1;
  var station_t = -1;

  trainsLeavingArray.forEach(function(train) {
    dataUtils.getPossibleHoppingOffStations(train, actor.location).forEach(function (station) {
      villains.forEach(function (vil) {
        if (vil === station) {
          train_t = train;
          station_t  = station;
        }
      })
    })
  });

  if (train_t === -1) {
    var train_t = R.head(trainsLeavingArray);
    // Take last station from train
    var station_t = R.head(dataUtils.getPossibleHoppingOffStations(train_t, actor.location));

  }


  var hopOffStations = dataUtils.getPossibleHoppingOffStations(train_t, actor.location);
  //Console.log(hopOffStations);
  for (var i = 0; i < hopOffStations.size; i++) {
    for (var j = 0; i < villains.size; j++) {
      console.log(hopOffStations[i] + ", " + villains[j]);
      if (hopOffStations[i] === villains[j]) {
        station_t = hopOffStations[i];
        return Actions.train(train_t, station_t);
      }
    }
  }

  // Take first train
  //var train = R.head(trainsLeavingArray);
  // Take last station from train
  //var hopOffStation = R.last(dataUtils.getPossibleHoppingOffStations(train, actor.location));
  // Hop to first train and got to the last station
  return Actions.train(train_t, station_t);
});
