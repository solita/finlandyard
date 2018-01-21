'use strict';

require('file-loader?name=[name].[ext]!./index.html');
var dataUtils = require('./state/DataUtils.js');
var stateUtils = require('./engine/StateTransformations.js');
var FyEngine = require('./engine/FyEngine.js');
var mapControl = require('./map/MapControl.js');
var log = require('./utils/Log.js');
var api = require('./utils/Api.js');
var moment = require('moment');
var R = require('ramda');
var ActorBridge = require('./ActorBridge.js');
var clock = require('./Clock.js');

function requireAll(r) { r.keys().forEach(r); }
requireAll(require.context('./actors/', true, /\.js$/));

console.log("Starting up finland yard");

var mapControl = mapControl();


// Evolves departure/arrival as moment instance (instead of raw string value)
var scheduleEntryToMoment = R.evolve({'scheduledTime': (rtime) =>  {
  var m = moment(rtime);
  if(m.seconds() > 30) {
    return clock(m.hours(), m.minutes() + 1);
  } else {
    return clock(m.hours(), m.minutes());
  }
}});

// Maps all timetables as moment instances
var processTimesToMomentInstances =
 R.map((timetableEntry) => R.assoc('timeTableRows',
          R.map(scheduleEntryToMoment, R.prop('timeTableRows', timetableEntry)), timetableEntry));

var getLocations = (state, type, prop) => R.compose(
        R.reject(R.isNil()),
        R.map(R.prop(prop)),
        R.reject(R.propEq('caught', true)))(stateUtils.getActors(state, type));

var createContext = (state) => {
  return {
    knownVillainLocations: getLocations(state, 'villain', 'location'),
    knownPoliceLocations: getLocations(state, 'police', 'location'),
    policeDestinations: getLocations(state, 'police', 'destination'),
  };
}

/**
 * Game callback after api-operations
 */
api.loadData(function(data) {
  if(data.timetable.length === 0) {
    console.error("No timetable rows found from api");
    return;
  }
  data.timetable = R.reject(R.propEq('trainType', 'HL'), data.timetable);

  data.timetable = processTimesToMomentInstances(data.timetable);

  dataUtils.initData(data);

  mapControl.drawConnections(dataUtils.collectConnections());
  mapControl.drawStations(dataUtils.connectedStations());

  var initialState = {};
  initialState.actors = ActorBridge.actors();

  initialState.clockIs = clock(4, 0);

  // THE game loop
  (function tick(state) {
    setTimeout(
      function() {

        if(stateUtils.gameOver(state)) {
          console.log('Game over');
          api.postResults(state.actors, document.getElementById("clock"));
          return;
        } else {
          tick(FyEngine.runGameIteration(mapControl, stateUtils, state));
        }


      }, 1)})(initialState);
});
