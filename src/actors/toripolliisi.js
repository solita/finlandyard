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
  console.log(actor.name +" leaving from " + actor.location + " to " + result.destination + ", departure: " +
      dataUtils.findTrainArrival(result.train, result.destination).scheduledTime.asString());
  return Actions.train(result.train, result.destination);
});

function findClosestVillain(context, currentStation, clockIs) {
//See if we can get to the villain with just one train
  var {shortest, dest, train} = findStraightConnections(context, currentStation, clockIs);
  if (!R.isNil(train)) {
    return {train: train, destination: dest};
  }
  if(context.knownVillainLocations.length == 1) {
      var route=dataUtils.howCanIGetTo(currentStation.stationShortCode, context.knownVillainLocations[0]);
      if(!route=='FROMHERE') {
        var firstStop=route[0];
        const ret =findTrainToFrom(clockIs, currentStation, firstStop);
        if(!R.isNil(ret.train) && !R.isNil(ret.dest)) {
          return {train: ret.train, destination: ret.dest};
        }
        return null;
      } else {
        const ret =findTrainToFrom(clockIs, currentStation, context.knownVillainLocations[0]);
        if(!R.isNil(ret.train) && !R.isNil(ret.dest)) {
          return {train: ret.train, destination: ret.dest};
        }
        return null;

      }
  }

  shortest=10000000;
  dest=null;
  train=null;
  for (var i = 0; i < context.knownVillainLocations.length; i++) {

    var villainLocation = context.knownVillainLocations[i];
    var station = dataUtils.getStationById(villainLocation);
    var destination = astar(currentStation, station, clockIs);
    if(destination != null && (destination.prev != currentStation.stationShortCode)) {
      debugger;
    }
    if (destination != null && destination.distance < shortest && destination.distance > 0) {
      shortest = destination.distance;
      dest=destination.destination;
      train=destination.train;
    }
  }
  if (!R.isNil(train)) {
    return {train: train, destination: dest};
  }
  if(R.isNil(train)) {
    var result=goToBigCity(context, currentStation, clockIs);
    if(!R.isNil(result)) {
      train=result.train;
      dest=result.destination;
    }

  }
  if (!R.isNil(train)) {
    return {train: train, destination: dest};
  }

  return null;
}

function goToBigCity(context, currentStation, clockIs) {
  var leaving = dataUtils.trainsLeavingFrom(clockIs, currentStation);
  var retreatingTo = null;
  var usingTrain = null;
  for(var i = 0; i < leaving.length; i++) {
    var possibleTrain = leaving[i];
    var hops = dataUtils.getPossibleHoppingOffStations(possibleTrain, actor.location);
    if(R.contains('HKI', hops)) {
      retreatingTo = 'HKI';
      usingTrain = possibleTrain;
      break;
    }
    if(R.contains('JNS', hops)) {
      retreatingTo = 'JNS';
      usingTrain = possibleTrain;
      break;
    }
    if(R.contains('TKU', hops)) {
      retreatingTo = 'TKU';
      usingTrain = possibleTrain;
      break;
    }
    if(R.contains('TPE', hops)) {
      retreatingTo = 'TPE';
      usingTrain = possibleTrain;
      break;
    }
    if(R.contains('OUL', hops)) {
      retreatingTo = 'TPE';
      usingTrain = possibleTrain;
      break;
    }

  }
  return {train: usingTrain, destination: retreatingTo};


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

function findTrainToFrom(clockIs, currentStation, villainLocation) {
  var leaving = dataUtils.trainsLeavingFrom(clockIs, currentStation.stationShortCode);
  var train = null;

  var timeToGetThere = null;
  var dest=null;
  var shortest=10000;

  for (var i = 0; i < leaving.length; i++) {
    var possibleTrain = leaving[i];
    var possibleHops = dataUtils.getPossibleHoppingOffStations(possibleTrain, currentStation.stationShortCode);
    if (R.contains(villainLocation, possibleHops)) {
      if(possibleTrain == null || villainLocation == null) {
        debugger;
      }
      var arrival = dataUtils.findTrainArrival(possibleTrain, villainLocation).scheduledTime;
      var travelTime = arrival.unix() - clockIs.unix();

      if (travelTime > 0 && travelTime < shortest) {
        //debugger;
        train = possibleTrain;
        timeToGetThere = arrival;
        shortest = travelTime;
        dest = villainLocation;

      }
    }
  }
  return {train,shortest, dest};
}

function findStraightConnections(context, currentStation, clockIs) {
  var shortest = 10000000;
  var dest = null;
  var train = null;
  for (var i = 0; i < context.knownVillainLocations.length; i++) {
    var villainLocation = context.knownVillainLocations[i];
    const ret = findTrainToFrom(clockIs, currentStation, villainLocation);
    shortest = ret.shortest;
    dest = ret.dest;
    train=ret.train;

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
  var stations = dataUtils.getAllStations();
  var stationShortkoodit = R.map(R.prop('stationShortCode'), stations);
  var stationObjs = R.map(createNode, stationShortkoodit);

  //gScore and distancesLeft have objects like {name: x, distance: y}
  var travelledDistances = stationObjs;
  var gStart=R.filter(R.propEq('name', start.stationShortCode), travelledDistances)[0];
  gStart.distance=0;
  travelledDistances=R.update(R.findIndex(R.propEq('name', start.stationShortCode), travelledDistances),gStart, travelledDistances);

  var distancesLeft = stationObjs;
  var startPoint=R.filter(R.propEq('name', start.stationShortCode), distancesLeft)[0];
  //Let's put some big value at the beginning, so that start station get's large score
  startPoint.distance = distance(start.latitude, start.longitude, goal.latitude, goal.longitude)*100;
  distancesLeft=R.update(R.findIndex(R.propEq('name', start.stationShortCode), distancesLeft),startPoint, distancesLeft);

  while (openSet.length > 0) {
    //Take the station with lowest distancesLeft
    var foundStations=R.filter(station => R.contains(station.name, R.pluck('stationShortCode', openSet)), distancesLeft);
    //Closest means the next city with smallest destination, at the beginning it is start
    var closest = R.sort(compareDistance, foundStations)[0];
    if(closest.name == goal.stationShortCode) {
      return reconstructPath(cameFrom, closest.name);
    }
    //Remove current station from the list of upcoming stations and add it to list of stations we already went through
    openSet=R.reject(R.propEq('stationShortCode', closest.name), openSet);
    closedSet.push(closest);
    var leavingTrains=dataUtils.trainsLeavingFrom(clockIs, closest.name);
    //Let's get all the neighbor stations and map stationName and train together
    var nextStops=R.map(train => {return {train: train, stationName: dataUtils.getPossibleHoppingOffStations(train, closest.name)[0]}})(leavingTrains);
    for (var i=0; i < nextStops.length; i++) {
      var neighbor=nextStops[i];
      //If we have already visited this city and found the shortest route there, don't continue
      if(R.contains(neighbor.stationName, R.pluck('name', closedSet))) {
          continue;
      }
      //Add current station to to list of stations we go through
      if(!R.contains(neighbor.stationName, R.pluck('name', openSet))) {
        openSet.push(R.find(R.propEq('stationShortCode', neighbor.stationName))(stations));

      }
      //Let's take distance travelled to this point
      var currentScore=R.find(R.propEq('name', closest.name), travelledDistances);
      //New score is current distance travelled + time to departure + travelling time
      currentScore.distance=currentScore.distance + (dataUtils.findTrainDeparture(neighbor.train, closest.name).scheduledTime.unix()-clockIs.unix())+(dataUtils.findTrainArrival(neighbor.train, neighbor.stationName).scheduledTime.unix() - dataUtils.findTrainDeparture(neighbor.train, closest.name).scheduledTime.unix());
      var currentStationGScore=R.find(R.propEq('name', neighbor.stationName), travelledDistances)
      if(currentScore.distance >= currentStationGScore.distance) {
        continue
      }
      var existing=R.find(R.propEq('destination', neighbor.stationName), cameFrom);
      if(!existing) {
        var newEntry={prev: closest.name, distance: currentScore.distance, train: neighbor.train, destination: neighbor.stationName};
        cameFrom.push(newEntry);
      }
      else if(existing.distance > currentScore.distance) {
        existing.distance=currentScore.distance;
        existing.destination=neighbor.stationName;
        cameFrom=R.update(R.findIndex(R.propEq('destination', neighbor.stationName), cameFrom),existing ,cameFrom);
      }

      currentStationGScore.distance=currentScore.distance;
      travelledDistances=R.update(R.findIndex(R.propEq('name', neighbor.stationName), travelledDistances),currentStationGScore, travelledDistances);

      var neighborStation=R.find(R.propEq('stationShortCode', neighbor.stationName), stations);
      var newFScore=currentStationGScore.distance + distance(neighborStation.latitude, neighborStation.longitude, goal.latitude, goal.longitude);
      currentStationGScore.distance=newFScore;
      distancesLeft=R.update(R.findIndex(R.propEq('name', neighbor.stationName), distancesLeft),currentStationGScore, distancesLeft);
    }
  }
}

var createNode = function (shortCode) {
  return {name: shortCode, distance: Infinity}
};

var reconstructPath=function(trainTrace, current) {
  var totalPath=[];
  var all=R.pluck('destination', trainTrace);
  while(R.contains(current, all)) {
    var nextTrain=R.filter(R.propEq('destination', current), trainTrace)[0];
    current=nextTrain.prev;
    totalPath.push(nextTrain);
  }

  return totalPath[totalPath.length-1];
};

var compareDistance = (station, nextStation) => station.distance > nextStation.distance;