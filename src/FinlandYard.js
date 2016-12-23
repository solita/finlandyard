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
}

loadData(function(state) {
  if(state.timetable.length === 0) {
    console.error("No timetable rows found from api");
    return;
  }
  var startingTime = moment(state.timetable[0].timeTableRows[0].scheduledTime);
  state.clockIs = startingTime.clone();
  mapControl.drawConnections(dataUtils.collectConnections(state));
  mapControl.drawStations(dataUtils.connectedStations(state));

  state.actors = [
    {type: 'police', name: 'Sorjonen',  location: 'JNS' },
    {type: 'villain', name: 'Mr. X', location: 'HKI', train: 1 }
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
          if(actor.train) {
            return actor;
          }
          var train = R.head(dataUtils.trainsLeavingFrom(state, actor.location));
          if(R.isNil(train)) {
            return actor;
          }
          console.log(actor.name + " takes train "
            + train.trainNumber + " to " + R.last(train.timeTableRows).stationShortCode
            + " from " + actor.location);
          return R.merge(actor, {train: train.trainNumber })
        });
        state = R.evolve({'actors': pickRandomTrain}, state);


        state = stateUtils.calculateNewPositions(state);

        mapControl.drawPolice(stateUtils.getActors(state, 'police'));
        mapControl.drawVillains(stateUtils.getActors(state, 'villain'));

        document.getElementById("clock").innerHTML = state.clockIs.format();
        visualizeStates(state);
        tick();
      },
      50)})();
});
