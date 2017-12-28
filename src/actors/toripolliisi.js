/**
 * Created by anniinasa on 21/12/17.
 */
var ActorBridge = require('../ActorBridge.js');
var dataUtils = require('../state/DataUtils.js');
var R = require('ramda');
var Actions = require('../Actions.js');

ActorBridge.registerActor('police', 'Jari Aarnio', 'TKU', function (clockIs, context, actor) {
  var currentStation = dataUtils.getStationById(actor.location)
  var shortest = 1000;
  var selectedVillainLocation = null;
  console.log("Finding closest villain...");
  for (var i = 0; i < context.knownVillainLocations.length; i++) {
    var villainLocation = context.knownVillainLocations[i];
    var station = dataUtils.getStationById(villainLocation);
    var dist = distance(currentStation.latitude, currentStation.longitude, station.latitude, station.longitude);

    if (dist < shortest && dist > 0) {
      shortest = dist;
      selectedVillainLocation = villainLocation;
    }
  }
  var route = dataUtils.howCanIGetTo(actor.location, selectedVillainLocation);
  var destination = selectedVillainLocation;
  if (route != "FROMHERE") {
    destination = route[0]
  }
  console.log(actor.name + " goes to closest villain with one train");
  var leaving = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  var train = null;

  var timeToGetThere = null;

  for (var i = 0; i < leaving.length; i++) {
    var possibleTrain = leaving[i];
    var possibleHops = dataUtils.getPossibleHoppingOffStations(possibleTrain, actor.location);
    if (R.contains(destination, possibleHops)) {
      var arrival = dataUtils.findTrainArrival(possibleTrain, destination).scheduledTime;
      if (!timeToGetThere || timeToGetThere.isBefore(arrival)) {
        train = possibleTrain;
        timeToGetThere = arrival;
      }
    }
  }

  if (!R.isNil(train)) {
    console.log(actor.name +" leaving from " + actor.location + " to " + destination + ", departure: " +
        dataUtils.findTrainArrival(train, destination).scheduledTime.asString());
    return Actions.train(train, destination);
  }
  console.log("Jari idlaa");
  return Actions.idle();


});

function distance(lat1, lon1, lat2, lon2, unit) {
  var radlat1 = Math.PI * lat1 / 180
  var radlat2 = Math.PI * lat2 / 180
  var theta = lon1 - lon2
  var radtheta = Math.PI * theta / 180
  var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist)
  dist = dist * 180 / Math.PI
  dist = dist * 60 * 1.1515
  if (unit == "K") {
    dist = dist * 1.609344
  }
  if (unit == "N") {
    dist = dist * 0.8684
  }
  return dist
}

var astar = (start, goal) => {
  console.log("Use astar to find the route from " + start + " to " + goal);

}