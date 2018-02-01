/**
 * Created by anniinasa on 21/12/17.
 */
import R from 'ramda'
import Actions from '../engine/Actions.js'
import ActorBridge from '../ActorBridge.js'
import dataUtils from '../state/DataUtils.js'
import {log} from '../utils/Log';


ActorBridge.registerActor('police', 'Jari Aarnio', 'TKU', function (clockIs, context, actor) {
  let currentStation = dataUtils.getStationById(actor.location);

  let result = findClosestVillain(context, currentStation, clockIs);
  if (!result) {
    return Actions.idle();
  }
  log(`${actor.name} leaving from ${actor.location} to ${result.destination}, arrival: ` +
      dataUtils.findTrainArrival(result.train, result.destination).scheduledTime.asString());
  return Actions.train(result.train, result.destination);
});

function findClosestVillain(context, currentStation, clockIs) {
 //See if we can get to the villain with just one train
  let {shortest, dest, train} = findStraightConnections(context, currentStation, clockIs);
  if (!R.isNil(train)) {
    return {train, destination: dest};
  }
  if (context.knownVillainLocations.length === 1) {
    const route = dataUtils.howCanIGetTo(currentStation.stationShortCode, context.knownVillainLocations[0]);
    const firstStop = route !== 'FROMHERE' ? route[0] : context.knownVillainLocations[0]
    const {train, dest: destination} = findTrainToFrom(clockIs, currentStation, firstStop);
    return train && destination ? {train, destination} : null
  }
  // If there wasn't straight connection to villainLocation and there are more than 1 villain, use astar to find the shortest path
  shortest = 10000000;
  dest = null;
  train = null;
  for (const villainLocation of context.knownVillainLocations) {
    const station = dataUtils.getStationById(villainLocation);
    const result = astar(currentStation, station, clockIs, shortest);
    if (result && Math.abs(result.distance) < shortest) {
      shortest = Math.abs(result.distance);
      dest = result.destination;
      train = result.train;
    }
  }
  if (!R.isNil(train)) {
    return {train: train, destination: dest};
  }
  // If we couldn't find path to villain, see if we can go to just some big city
  if (R.isNil(train)) {
    let result = goToBigCity(context, currentStation, clockIs);
    if (!R.isNil(result)) {
      train = result.train;
      dest = result.destination;
    }

  }
  if (!R.isNil(train)) {
    return {train: train, destination: dest};
  }
  //If still no success (trains don't go to villain location or any big city), we return null so that we know not to after this villain
  return null;
}

const bigCities = ['HKI', 'JNS', 'TKU', 'TPE', 'OUL'];

const getFirstBigCity = R.pipe(
    R.intersection(bigCities),
    R.head
);

const goToBigCity = (context, currentStation, clockIs) => {
  const leavingTrains = dataUtils.trainsLeavingFrom(clockIs, currentStation);
  let train, destination;

  for (let possibleTrain of leavingTrains) {
    const hops = dataUtils.getPossibleHoppingOffStations(possibleTrain, currentStation);
    const bigCity = getFirstBigCity(hops);

    if (bigCity) {
      train = possibleTrain;
      destination = bigCity;
      break;
    }
  }

  return {train, destination}
}

const distance = (lat1, lat2, long1, long2) => Math.sqrt( Math.pow((lat1-lat2), 2) + Math.pow((long1-long2), 2));

function findTrainToFrom(clockIs, currentStation, villainLocation) {
  let leaving = dataUtils.trainsLeavingFrom(clockIs, currentStation.stationShortCode);
  let train, timeToGetThere, dest;

  let shortest = 10000;

  for(const possibleTrain of leaving) {
    let possibleHops = dataUtils.getPossibleHoppingOffStations(possibleTrain, currentStation.stationShortCode);
    if (R.contains(villainLocation, possibleHops)) {
      let arrival = dataUtils.findTrainArrival(possibleTrain, villainLocation).scheduledTime;
      let travelTime = arrival.unix() - clockIs.unix();

      if (travelTime > 0 && travelTime < shortest) {
        train = possibleTrain;
        timeToGetThere = arrival;
        shortest = travelTime;
        dest = villainLocation;

      }
    }
  }
  return {train, shortest, dest};
}

function findStraightConnections(context, currentStation, clockIs) {
  let shortest = 10000000;
  let dest, train;
  for (const villainLocation of context.knownVillainLocations) {
    const ret = findTrainToFrom(clockIs, currentStation, villainLocation);
    if(ret.shortest < shortest) {
      shortest = ret.shortest;
      dest = ret.dest;
      train = ret.train;
    }
  }
  return {shortest, dest, train};
}

const getStationShortCodes = (stations) => R.map(R.prop('stationShortCode'), stations);

const findClosestStation=(foundStations)  => {
  return R.head(R.sort(compareDistance, foundStations));
};

const getInformationForCurrentLocation = (currentLocation, travelledDistances) => {return R.head(R.filter(R.propEq('name', currentLocation), travelledDistances));}

let astar = (start, goal, clockIs, currentShortest) => {
  if (start.stationShortCode === goal.stationShortCode) {
    return null;
  }
  //Initialize needed sets and starting point
  let closedSet = [];
  let openSet = [start];
  let cameFrom = [];
  const stations = dataUtils.getAllStations();
  const stationShortKoodit = getStationShortCodes(stations);
  const stationObjs = R.map(createNode, stationShortKoodit);

  //gScore and distancesLeft have objects like {name: x, distance: y}
  let travelledDistances = stationObjs;
  const gStart = getInformationForCurrentLocation(start.stationShortCode, travelledDistances);
  gStart.distance = 0;
  travelledDistances = R.update(R.findIndex(R.propEq('name', start.stationShortCode), travelledDistances), gStart, travelledDistances);

  let distancesLeft = stationObjs;
  const startPoint=getInformationForCurrentLocation(start.stationShortCode, distancesLeft);
  //Let's put some big value at the beginning, so that start station get's large score
  startPoint.distance = distance(start.latitude, start.longitude, goal.latitude, goal.longitude);
  distancesLeft = R.update(R.findIndex(R.propEq('name', start.stationShortCode), distancesLeft), startPoint, distancesLeft);

  while (openSet.length > 0) {

    //Take the station with lowest distancesLeft
    const foundStations = R.filter(station => R.contains(station.name, R.pluck('stationShortCode', openSet)), distancesLeft);
    //Closest means the next city with smallest destination, at the beginning it is start
    const closest = findClosestStation(foundStations);
    if (closest.name === goal.stationShortCode) {
      return reconstructPath(cameFrom, closest.name);;
    }
    //Remove current station from the list of upcoming stations and add it to list of stations we already went through
    openSet = R.reject(R.propEq('stationShortCode', closest.name), openSet);
    closedSet.push(closest);
    const leavingTrains = dataUtils.trainsLeavingFrom(clockIs, closest.name);
    //Let's get all the neighbor stations and map stationName and train together
    const nextStops = R.map(train => {
      return {train: train, stationName: dataUtils.getPossibleHoppingOffStations(train, closest.name)[0]}
    })(leavingTrains);
    for (const neighbor of nextStops) {
      //If we have already visited this city and found the shortest route there, don't continue
      if (R.contains(neighbor.stationName, R.pluck('name', closedSet))) {
        continue;
      }
      //Add current station to to list of stations we go through
      if (!R.contains(neighbor.stationName, R.pluck('name', openSet))) {
        openSet.push(R.head(R.filter(R.propEq('stationShortCode', neighbor.stationName),stations)));

      }
      //Let's take distance travelled to this point
      const currentScore = R.find(R.propEq('name', closest.name), travelledDistances);
      //New score is current distance travelled + time to departure + travelling time
      currentScore.distance = currentScore.distance + (dataUtils.findTrainDeparture(neighbor.train, closest.name).scheduledTime.unix() - clockIs.unix()) + (dataUtils.findTrainArrival(neighbor.train, neighbor.stationName).scheduledTime.unix() - dataUtils.findTrainDeparture(neighbor.train, closest.name).scheduledTime.unix());
      const currentStationGScore = R.find(R.propEq('name', neighbor.stationName), travelledDistances);
      if (currentScore.distance >= currentStationGScore.distance) {
        continue
      }
      const existing = R.find(R.propEq('destination', neighbor.stationName), cameFrom);
      if (!existing) {
        const newEntry = {
          prev: closest.name,
          distance: currentScore.distance,
          train: neighbor.train,
          destination: neighbor.stationName
        };
        cameFrom.push(newEntry);
      }
      else if (existing.distance > currentScore.distance) {
        existing.distance = currentScore.distance;
        existing.destination = neighbor.stationName;
        cameFrom = R.update(R.findIndex(R.propEq('destination', neighbor.stationName), cameFrom), existing, cameFrom);
      }

      //If the villain is far far away or we already have villain closer don't continue
      if(Math.abs(currentScore.distance) > 150000 || Math.abs(currentScore.distance) > currentShortest) {
        return null;
      }

      currentStationGScore.distance = currentScore.distance;
      travelledDistances = R.update(R.findIndex(R.propEq('name', neighbor.stationName), travelledDistances), currentStationGScore, travelledDistances);

      const neighborStation = R.find(R.propEq('stationShortCode', neighbor.stationName), stations);
      const newFScore = currentStationGScore.distance + distance(neighborStation.latitude, neighborStation.longitude, goal.latitude, goal.longitude);
      currentStationGScore.distance = newFScore;
      distancesLeft = R.update(R.findIndex(R.propEq('name', neighbor.stationName), distancesLeft), currentStationGScore, distancesLeft);
    }
  }
}

const createNode = function (shortCode) {
  return {name: shortCode, distance: Infinity}
};

const reconstructPath = function (trainTrace, current) {
  let totalPath = [];
  let all = R.pluck('destination', trainTrace);
  while (R.contains(current, all)) {
    let nextTrain = R.head(R.filter(R.propEq('destination', current), trainTrace));
    current = nextTrain.prev;
    totalPath.push(nextTrain);
  }
  //We want to pass the distance for the whole path, not just to the next station
  totalPath[totalPath.length - 1].distance=totalPath[0].distance;
  return totalPath[totalPath.length - 1];
};

const compareDistance = (station, nextStation) => station.distance > nextStation.distance;