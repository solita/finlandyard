'use strict';

require('file-loader?name=[name].[ext]!./index.html');
var dataUtils = require('./state/DataUtils.js');
var stateUtils = require('./state/StateUtils.js');
var mapControl = require('./map/MapControl.js');
var log = require('./Log.js');
var api = require('./Api.js');
var moment = require('moment');
var R = require('ramda');
var ActorBridge = require('./ActorBridge.js');
var clock = require('./Clock.js');

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

  var state = {};
  state.actors = ActorBridge.actors();

  state.clockIs = clock(4, 0);

  // THE game loop
  (function tick() {
    setTimeout(
      function() {
        // Proceed
        state.clockIs.tick();

        // Applies ai functions
        var applyAI = R.map((actor) => {
          // AI is not applied when travelling or caught

          if(actor.train || actor.caught) {
            return actor;
          }
          try {
            var action = actor.aifn(R.clone(state.clockIs), createContext(state), actor);
          } catch (error) {
            log.log(state.clockIs, "Haha, doesn't work for " + actor.name + " throws an exception");
            console.error(error);
            return actor;
          }
          switch(action.type) {
            case 'IDLE':
              return actor;
            case 'TRAIN':
              if(R.isNil(action.trainNumber)) {
                log.log(state.clockIs, "Haha, doesn't work for " + actor.name + " trainNumber null in command");
                return actor;
              }
              if(!action.destination) {
                log.log(state.clockIs, "Haha, doesn't work for " + actor.name + " destination null in command");
                return actor;
              }
              if(!dataUtils.assertAction(action)) {
                log.log(state.clockIs, "Haha, doesn't work for " + actor.name + " can't travel to " + action.destination + " with " + action.trainNumber);
                return actor;
              }
              // Logging this is somewhat tricky
              log.log(state.clockIs, actor.name + " decides to leave to " + action.destination + " with train " + action.trainNumber +
                " departure " + dataUtils.findTrainDeparture(dataUtils.getTrainById(action.trainNumber), actor.location).scheduledTime.asString() +
                " arrival " + dataUtils.findTrainArrival(dataUtils.getTrainById(action.trainNumber), action.destination).scheduledTime.asString());
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
        mapControl.drawClock(state.clockIs);
        mapControl.render();
        //document.getElementById("clock").innerHTML = state.clockIs.asString();
        //nvisualizeStates(state);

        if(stateUtils.gameOver(state)) {
          console.log('Game over');
          var printStats = police => console.log(police.name + " caught " + police.stats + " villains")
          var polices=R.filter(R.propEq('type', 'police'))(state.actors)
          R.forEach(printStats, polices)

          api.postResults(state.actors, document.getElementById("clock"));
          return;
        } else {
          tick();
        }


      }, 1)})();
});
