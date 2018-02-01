/** DataUtils contains functions, which need pre calculated data structures. */
import R from 'ramda';
import moment from 'moment';
import clock from '../Clock.js';

const throwIfNull = (message, value) => R.ifElse(
  R.isNil,
  () => {throw Error(message)},
  R.identity
)(value);

// Drops until from sequence until fn is truthy. First truthy element is also dropped!
const dropUntil = (fn, coll) => R.reduce(
  (acc, value) => fn(value) ? R.reduced(R.tail(acc)) : R.tail(acc),
coll, coll);

// Evolves departure/arrival as moment instance (instead of raw string value)
const scheduleEntryToMoment = R.evolve({'scheduledTime': (rtime) =>  {
  if (typeof rtime !== 'string') {
    return rtime;
  }

  const m = moment(rtime);

  if(m.seconds() > 30) {
    return clock(m.hours(), m.minutes() + 1);
  } else {
    return clock(m.hours(), m.minutes());
  }
}});

// Maps all timetables as moment instances
const processTimesToMomentInstances = R.map(
  (timetableEntry) => R.assoc(
    'timeTableRows',
    R.map(scheduleEntryToMoment, R.prop('timeTableRows', timetableEntry)), timetableEntry
  )
);

let dataHolder = {};
let stationConnections = {};

const initData = data => {
  data.timetable = processTimesToMomentInstances(R.reject(R.propEq('trainType', 'HL'), data.timetable));
  dataHolder = data;
  dataHolder.timetable.map(function(train) {
    const x = R.reduce((acc, departure) => {
      return R.assoc(
        departure.stationShortCode,
        getPossibleHoppingOffStations(train, departure.stationShortCode),
        acc
      );
    }, {}, R.filter(R.propEq('type', 'DEPARTURE'), train.timeTableRows));

    R.forEach((key) => {
      if(stationConnections[key]) {
        stationConnections[key] = R.uniq(R.concat(stationConnections[key], R.prop(key, x)));
      } else {
        stationConnections[key] = R.prop(key, x);
      }
    }, R.keys(x));
  });
}

const howCanIGetTo = (from, to) => {
  const possibleDestinations = R.prop(from, stationConnections);

  if(R.contains(to, possibleDestinations)) {
    return "FROMHERE";
  }

  const viaList = [];

  for(let i = 0; i < possibleDestinations.length; i++) {
    const destination = possibleDestinations[i];

    if(R.prop(destination, stationConnections) && R.contains(to, R.prop(destination, stationConnections))) {
      viaList.push(destination);
    }
  }

  return viaList;
}

const getStationById = R.memoize(id => throwIfNull(
  R.concat("No such station: ", id),
  R.find(R.propEq('stationShortCode', id), dataHolder.stations)
))

const getTrainById = R.memoize(id => throwIfNull(
  R.concat("No such train: ", id),
  R.find(R.propEq('trainNumber', id), dataHolder.timetable)
))

const assertAction = action => {
  return R.contains(
    action.destination,
    R.map(
      R.prop('stationShortCode'),
      getTrainById(action.trainNumber).timeTableRows
    )
  );
}

const stationCoordinates = id => {
  const coords = R.juxt([R.prop('longitude'), R.prop('latitude')]);
  return coords(getStationById(id));
}

const findTrainDeparture = (train, location) => {
  return R.find(R.allPass([R.propEq('stationShortCode', location), R.propEq('type', 'DEPARTURE')]), train.timeTableRows);
}

const findTrainArrival = (train, location) => {
  return R.find(R.allPass([R.propEq('stationShortCode', location), R.propEq('type', 'ARRIVAL')]), train.timeTableRows);
}

const trainsLeavingFrom = (clockIs, stationShortCode) => {
  return R.filter(
    R.compose(
      a => {
        const v = R.find(R.propEq('stationShortCode', stationShortCode), a);

        if(R.isNil(v)) {
          return false;
        }

        return clockIs.isBefore(v.scheduledTime);
      },
      R.filter(R.propEq('type', 'DEPARTURE')),
      R.prop('timeTableRows')
    ),
    dataHolder.timetable
  );
}

const getPossibleHoppingOffStations = (train, actorLocation) => {
  return R.map(R.prop('stationShortCode'), R.filter(
    R.allPass([R.propEq('trainStopping', true), R.propEq('type', 'ARRIVAL')]),
    dropUntil(R.propEq('stationShortCode', actorLocation), train.timeTableRows))
  );
}

const connectionCountFromStation = (stationShortCode) => {
  return R.filter(
    R.compose(
      (a) => {
        const v = R.find(R.propEq('stationShortCode', stationShortCode), a);
        return !R.isNil(v);
      },
      R.filter(R.propEq('type', 'DEPARTURE')),
      R.prop('timeTableRows')),
    dataHolder.timetable).length;
}

const nextLeavingTrain = (clockIs, location) => {
  const trains = trainsLeavingFrom(clockIs, location);

  return R.reduce((currentlyNext, train) => {
    if(findTrainDeparture(train, location).scheduledTime.unix() < findTrainDeparture(currentlyNext, location).scheduledTime.unix()) {
      return train;
    }

    return currentlyNext;
  }, R.head(trains), R.tail(trains));
}

const collectConnections = () => {
  // Partial for accessing coordinates from dataHolder
  const coordsById = R.partial(stationCoordinates, []);

  const timeTableRows = R.compose(
    // Map coordinates to stations
    R.map(R.evolve({from: coordsById, to: coordsById})),
    R.map((con) => {
      return {from: R.head(con), to: R.last(con)}
    }),

    // Reduce all unique connections, unique is MUCH faster with strings, hence R.join
    R.uniqBy(R.compose(R.join('-'), R.sortBy(R.identity))),

    // We know its [DEPARTURE, ARRIVAL, DEPARTURE, ARRVIVAL...]
    // So we get collection of tuples [[HKI, PSL], [PSL, LKJ] ...]
    R.splitEvery(2),

    // Map every station id from routes: [HKI, PSL, PSL, LKJ, LKJ, JEK, JEK ....]
    R.map(R.prop('stationShortCode')),
    R.flatten,
    R.map(R.prop('timeTableRows'))
  );

  return timeTableRows(dataHolder.timetable);
}

const getAllStations=()=> {
  return dataHolder.stations
}

const connectedStations = () => {
  if(R.isNil(dataHolder.timetable)) {
    return [];
  }

  const collector = R.compose(
    R.map(R.partial(getStationById, [])),
    R.uniqBy(R.identity),
    R.map(R.prop('stationShortCode')),
    R.flatten,
    R.map(R.prop('timeTableRows'))
  );

  return collector(dataHolder.timetable);
}

export default {
  initData,
  howCanIGetTo,
  getStationById,
  getTrainById,
  assertAction,
  stationCoordinates,
  findTrainDeparture,
  findTrainArrival,
  trainsLeavingFrom,
  getPossibleHoppingOffStations,
  connectionCountFromStation,
  nextLeavingTrain,
  collectConnections,
  connectedStations,
  getAllStations
}