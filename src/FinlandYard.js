'use strict';

require('file?name=[name].[ext]!./index.html');
var dataUtils = require('./state/DataUtils.js');
var stateUtils = require('./state/StateUtils.js');
var mapControl = require('./map/MapControl.js');
var log = require('./Log.js');
var loadData = require('./Api.js');
var moment = require('moment');
var R = require('ramda');

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

var randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);


loadData(function(state) {
  if(state.timetable.length === 0) {
    console.error("No timetable rows found from api");
    return;
  }
  var startingTime = moment(state.timetable[0].departureDate).subtract(1, 'minutes');

  state.timetable = R.reject(R.propEq('trainType', 'HL'), state.timetable);

  state.clockIs = startingTime.clone();
  mapControl.drawConnections(dataUtils.collectConnections(state));
  mapControl.drawStations(dataUtils.connectedStations(state));

  state.actors = [
    {id: 1, type: 'police', name: 'Sorjonen',  location: 'HKI', caught: false, freeMinutes: 0 },
    //{id: 1, type: 'police', name: 'McNulty',  location: 'VAA', caught: false, freeMinutes: 0 },
    //{id: 1, type: 'police', name: 'Sipowitch',  location: 'TKU', caught: false, freeMinutes: 0 },

    //{id: 2, type: 'villain', name: 'Mr. X', location: 'HKI', caught: false, freeMinutes: 0 },
    //{id: 3, type: 'villain', name: 'Ms. Y', location: 'TPE', caught: false, freeMinutes: 0 },
    //{id: 3, type: 'villain', name: 'To moscow', location: 'HKI', train: 31, destination: "MVA", caught: false, freeMinutes: 0 },
  ];

  // THE game loop
  (function tick() {
    setTimeout(
      function() {
        // Edistä kelloa
        state.clockIs = state.clockIs.add(1, 'minutes');
        if(state.clockIs.unix() - startingTime.unix() > 1 * 24 * 60 * 60) {
          state.clockIs = startingTime.clone();
        }

        // Random AI (this can be turned into apply ai?)
        var pickRandomTrain = R.map((actor) => {
          if(actor.train || actor.caught) {
            return actor;
          }
          var leavingTrains=dataUtils.trainsLeavingFrom(state, actor.location);
          if(leavingTrains.length == 0) {
            //log.log(state.clockIs, "N0 trains leaving, is this bad?")
            return actor;
          }

          var train = randomNth(leavingTrains);
          console.log(train);
          if(R.isNil(train)) {
            return actor;
          }
          var chosenDestination = randomNth(R.filter(R.propEq('trainStopping', true), R.tail(train.timeTableRows)));
          console.log(chosenDestination);
          actor = R.merge(actor, {train: train.trainNumber,
            destination: chosenDestination.stationShortCode});
          console.log(actor);
          var departTime=train.timeTableRows[0].scheduledTime;

          log.log(state.clockIs, actor.name + " takes train "
            + train.trainNumber
            + " from '" + dataUtils.getStationById(state, actor.location).stationName
            + "' to '" + dataUtils.getStationById(state, actor.destination).stationName
            + "' which departs at " + departTime.substr(departTime.indexOf('T')+1, 5))


          return actor;
        });

        state = R.evolve({'actors': pickRandomTrain}, state);

        state = stateUtils.calculateNewPositions(state);
        state = stateUtils.applyStateChanges(state);

        mapControl.drawPolice(stateUtils.getActors(state, 'police'));
        mapControl.drawVillains(stateUtils.getActors(state, 'villain'));

        document.getElementById("clock").innerHTML = state.clockIs.toISOString();
        visualizeStates(state);
        tick();


      },
      10)})();
});
