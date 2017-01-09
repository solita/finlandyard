'use strict';

require('file?name=[name].[ext]!./index.html');
var dataUtils = require('./state/DataUtils.js');
var stateUtils = require('./state/StateUtils.js');
var mapControl = require('./map/MapControl.js');
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
    iDiv.innerHTML = JSON.stringify(actor, null, '   ');

    container.appendChild(iDiv);
  });
    state.caughtVillains.forEach(function(villain) {
        var iDiv = document.createElement('div');
        iDiv.className = "caughtContainer";
        iDiv.innerHTML = JSON.stringify(villain, null, '   ');

        container.appendChild(iDiv);
    });
}

loadData(function(state) {
  if(state.timetable.length === 0) {
    console.error("No timetable rows found from api");
    return;
  }
  var startingTime = moment(state.timetable[0].departureDate);
  debugger;
  state.clockIs = startingTime.clone();
  mapControl.drawConnections(dataUtils.collectConnections(state));
  mapControl.drawStations(dataUtils.connectedStations(state));

  state.actors = [
    {id: 1, type: 'police', name: 'Sorjonen',  location: 'JNS' },
    {id: 2, type: 'villain', name: 'Mr. X', location: 'HKI'},
    {id: 3, type:'villain', name: 'Ms. Y', location: 'TPE'}
  ];

  state.caughtVillains=new Array();

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
          if(actor.train) {
            return actor;
          }
          var leavingTrains=dataUtils.trainsLeavingFrom(state, actor.location);
          if(leavingTrains.length == 0) {
            return actor;
          }
          var number=Math.floor(Math.random()*6);
          var train = R.nth(number)(leavingTrains);
          if(R.isNil(train)) {
            return actor;
          }
          console.log(actor.name + " takes train "
            + train.trainNumber + " to " + R.last(train.timeTableRows).stationShortCode
            + " from " + actor.location);

          var departTime=train.timeTableRows[0].scheduledTime;
          console.log("Train will depart at " + departTime.substr(departTime.indexOf('T')+1, 5));
          if(!actor.location) {
            debugger;
          }
          return R.merge(actor, {train: train.trainNumber })
        });
        //Check whether the villains are in the same location as police is (or in same train)
        var police=stateUtils.getActors(state, 'police');
        var caughtVillains=stateUtils.getCaughtVillains(state, police[0])
        if(caughtVillains.length > 0) {
          stateUtils.removeActors(state, caughtVillains);
        }

        state = R.evolve({'actors': pickRandomTrain}, state);

        state = stateUtils.calculateNewPositions(state);

        mapControl.drawPolice(stateUtils.getActors(state, 'police'));
        mapControl.drawVillains(stateUtils.getActors(state, 'villain'));

        document.getElementById("clock").innerHTML = state.clockIs.toISOString();
        visualizeStates(state);
        if(state.actors.length > 1) {
            tick();
        } else {
            console.log("Game over!");
        }

      },
      50)})();
});
