/**
 * Created by anniinasa on 21/12/17.
 */
import R from 'ramda'
import Actions from '../engine/Actions.js'
import ActorBridge from '../ActorBridge.js'
import dataUtils from '../state/DataUtils.js'


ActorBridge.registerActor('police', 'Jari Aarnio', 'TKU', function (clockIs, context, actor) {
  var currentStation = dataUtils.getStationById(actor.location);

  var result=findClosestVillain(context, currentStation, clockIs);
  if(result == null) {
    return Actions.idle();
  }
  console.log(actor.name +" leaving from " + actor.location + " to " + result.dist + ", departure: " +
      dataUtils.findTrainArrival(result.train, result.dist).scheduledTime.asString());
  return Actions.train(result.train, result.dist);
});

function findClosestVillain(context, currentStation, clockIs) {
//See if we can get to the villain with just one train
  var {shortest, dest, train} = findStraightConnections(context, currentStation, clockIs);
  if (!R.isNil(train)) {
    return {train: train, dist: dest};
  }

  shortest=10000000;
  dest=null;
  train=null;
  for (var i = 0; i < context.knownVillainLocations.length; i++) {
    var villainLocation = context.knownVillainLocations[i];
    var station = dataUtils.getStationById(villainLocation);
    var dist = astar(currentStation, station, clockIs)
    if (dist != null && dist.distance < shortest && dist.distance > 0) {
      shortest = dist.distance;
      dest=dist.destination;
      train=dist.train;
    }
  }
  if (!R.isNil(train)) {
    return {train: train, dist: dest};
  }
  return null;
}

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

function findStraightConnections(context, currentStation, clockIs) {
  var shortest = 10000000;
  var dest = null;
  var train = null;
  for (var i = 0; i < context.knownVillainLocations.length; i++) {
    var villainLocation = context.knownVillainLocations[i];
    var leaving = dataUtils.trainsLeavingFrom(clockIs, currentStation.stationShortCode);
    var train = null;

    var timeToGetThere = null;

    for (var i = 0; i < leaving.length; i++) {
      var possibleTrain = leaving[i];
      var possibleHops = dataUtils.getPossibleHoppingOffStations(possibleTrain, currentStation.stationShortCode);
      if (R.contains(villainLocation, possibleHops)) {
        var arrival = dataUtils.findTrainArrival(possibleTrain, villainLocation).scheduledTime;
        if (!timeToGetThere || timeToGetThere.isBefore(arrival)) {
          if (timeToGetThere < shortest) {
            train = possibleTrain;
            timeToGetThere = arrival;
            shortest = timeToGetThere;
            dest = villainLocation;
          }

        }
      }
    }

  }
  return {shortest, dest, train};
}

var astar = (start, goal, clockIs) => {
  if(start.stationShortCode == goal.stationShortCode) {
    return null;
  }
  //Initialize needed sets and starting point
  var closedSet = [];
  var openSet = [start];
  var cameFrom = [];
  var stations = dataUtils.getAllStations()
  var stationShortkoodit = R.map(R.prop('stationShortCode'), stations);
  var stationObjs = R.map(createNode, stationShortkoodit);

  //gScore and fScore have objects like {name: x, distance: y}
  var gScore = stationObjs;
  var gStart=R.filter(R.propEq('name', start.stationShortCode), gScore)[0];
  gStart.distance=0
  gScore=R.update(R.findIndex(R.propEq('name', start.stationShortCode), gScore),gStart, gScore)

  var fScore = stationObjs;
  var fStart=R.filter(R.propEq('name', start.stationShortCode), fScore)[0];
  //Let's put some big value at the beginning, so that start station get's large score
  fStart.distance = distance(start.latitude, start.longitude, goal.latitude, goal.longitude)*100;
  fScore=R.update(R.findIndex(R.propEq('name', start.stationShortCode), fScore),fStart, fScore)

  while (openSet.length > 0) {
    var foundStations=R.filter(station => R.contains(station.name, R.pluck('stationShortCode', openSet)), fScore);
    //Closest means the next city with smallest destination, at the beginning it is start
    var closest = R.sort(compareDistance, foundStations)[0];
    if(closest.name == goal.stationShortCode) {
      return reconstructPath(cameFrom, closest.name);
    }
    openSet=R.reject(R.propEq('stationShortCode', closest.name), openSet);
    closedSet.push(closest);
    var leavingTrains=dataUtils.trainsLeavingFrom(clockIs, closest.name);
    //Let's map stationName and train together
    var nextStops=R.map(train => {return {train: train, stationName: dataUtils.getPossibleHoppingOffStations(train, closest.name)[0]}})(leavingTrains);
    for (var i=0; i < nextStops.length; i++) {
      var neighbor=nextStops[i];
      if(R.contains(neighbor.stationName, R.pluck('name', closedSet))) {
          continue
      }
      if(!R.contains(neighbor.stationName, R.pluck('name', openSet))) {
        openSet.push(R.find(R.propEq('stationShortCode', neighbor.stationName))(stations));

      }
      var currentScore=R.find(R.propEq('name', closest.name), gScore);
      currentScore.distance=currentScore.distance + (dataUtils.findTrainDeparture(neighbor.train, closest.name).scheduledTime.unix()-clockIs.unix())+(dataUtils.findTrainArrival(neighbor.train, neighbor.stationName).scheduledTime.unix() - dataUtils.findTrainDeparture(neighbor.train, closest.name).scheduledTime.unix());
      var currentStationGScore=R.find(R.propEq('name', neighbor.stationName), gScore)
      if(currentScore.distance >= currentStationGScore.distance) {
        continue
      }
      var existing=R.find(R.propEq('prev', closest.name), cameFrom);
      if(!existing) {
        var newEntry={prev: closest.name, other: {distance: currentScore.distance, train: neighbor.train, destination: neighbor.stationName}};
        cameFrom.push(newEntry);
      }
      else if(existing.other.distance > currentScore.distance) {
        existing.other.distance=currentScore.distance;
        R.update(R.findIndex(R.propEq('destination', neighbor.name), cameFrom),existing ,cameFrom);
      }

      currentStationGScore.distance=currentScore.distance;
      gScore=R.update(R.findIndex(R.propEq('name', neighbor.stationName), gScore),currentStationGScore, gScore);

      var neighborStation=R.find(R.propEq('stationShortCode', neighbor.stationName), stations);
      var fScoreNow=R.find(R.propEq('name', neighbor.stationName), fScore);
      var newFScore=fScoreNow.distance + distance(neighborStation.latitude, neighborStation.longitude, goal.latitude, goal.longitude);
      currentStationGScore.distance=newFScore;
      fScore=R.update(R.findIndex(R.propEq('name', neighbor.stationName), fScore),currentStationGScore, fScore);
    }
  }
}

var createNode = function (shortCode) {
  return {name: shortCode, distance: Infinity}
};

var reconstructPath=function(trainTrace, current) {
  var totalPath=[]

  var steps=R.map(step => step.other)(trainTrace)
  var all=R.pluck('destination', steps);
  debugger;
  while(R.contains(current, all)) {
    var nextTrain=R.filter(R.propEq('destination', current), steps);
    debugger;
    var entry=R.find(R.propEq('other', nextTrain[0]), trainTrace)
    current=entry.prev;
    totalPath.push(entry);
  }
  debugger;
  return totalPath[totalPath.length-1];
}

var reconstruct_path = (trainTrace) => {return trainTrace[0]};

var compareDistance = (station, nextStation) => station.distance > nextStation.distance;