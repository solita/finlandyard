'use strict';

require('file?name=[name].[ext]!./index.html');
var dataUtils = require('./state/DataUtils.js');
var stateUtils = require('./state/StateUtils.js');
var mapControl = require('./map/MapControl.js');
var log = require('./Log.js');
var loadData = require('./Api.js');
var moment = require('moment');
var R = require('ramda');
var ActorBridge = require('./ActorBridge.js');

function requireAll(r) { r.keys().forEach(r); }
requireAll(require.context('./actors/', true, /\.js$/));

console.log("Starting up finland yard");

var mapControl = mapControl();

function visualizeStates(state) {
  var container = document.getElementById("states");
  container.innerHTML = '';
  state.actors.forEach(function(actor) {
    var iDiv = document.createElement('div');
    iDiv.className = "statecontainer";
    if(actor.caught) {
      iDiv.className = iDiv.className + " caught";
    }
    iDiv.innerHTML = JSON.stringify(actor, null, '   ');

    container.appendChild(iDiv);
  });
}

// Evolves departure/arrival as moment instance (instead of raw string value)
var scheduleEntryToMoment = R.evolve({'scheduledTime': (rtime) => moment(rtime)});

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
loadData(function(state) {
  if(state.timetable.length === 0) {
    console.error("No timetable rows found from api");
    return;
  }
  state.timetable = R.reject(R.propEq('trainType', 'HL'), state.timetable);
  var startingTime = moment(state.timetable[0].timeTableRows[0].scheduledTime);

  state.timetable = processTimesToMomentInstances(state.timetable);

  mapControl.drawConnections(dataUtils.collectConnections(state));
  mapControl.drawStations(dataUtils.connectedStations(state));

  state.actors = ActorBridge.actors();


  var startingTime = startingTime.subtract(1, 'minutes');
  state.clockIs = startingTime.clone();

  // THE game loop
  (function tick() {
    setTimeout(
      function() {
        // Edistä kelloa
        state.clockIs = state.clockIs.add(1, 'minutes');
        if(state.clockIs.unix() - startingTime.unix() > 1 * 24 * 60 * 60) {
          state.clockIs = startingTime.clone();
        }

        // Applies ai functions
        var applyAI = R.map((actor) => {
          // AI is not applied when travelling or caught

          if(actor.train || actor.caught) {
            return actor;
          }
          var action = actor.aifn(state, createContext(state), actor);
          switch(action.type) {
            case 'IDLE':
              return actor;
            case 'TRAIN':
              if(!action.trainNumber) {
                log.log(state.clockIs, "Haha, doesn't work for " + actor.name + " trainNumber null in command");
                return actor;
              }
              if(!action.destination) {
                log.log(state.clockIs, "Haha, doesn't work for " + actor.name + " destination null in command");
                return actor;
              }
              console.log(action.destination);
              // Logging this is somewhat tricky
              return R.merge(actor, {train: action.trainNumber, destination: action.destination});
            default:
              log.log(state.clockIs, "HAHA, " + actor.name + " barfs!!!");
          }
        });

        // Apply ai functions
        state = R.evolve({'actors': applyAI}, state);

        state = stateUtils.applyStateChanges(state);
        state = stateUtils.calculateNewPositions(state);

        mapControl.drawPolice(stateUtils.getActors(state, 'police'));
        mapControl.drawVillains(stateUtils.getActors(state, 'villain'));

        document.getElementById("clock").innerHTML = state.clockIs.toISOString();
        visualizeStates(state);

        if(stateUtils.gameOver(state)) {
          alert('Game over, villains caught');
          // TODO: post to scoreboard
        } else {
          tick();
        }


      },
      10)})();
});
