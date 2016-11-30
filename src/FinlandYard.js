'use strict';

require('file?name=[name].[ext]!./index.html');
var dataUtils = require('./DataUtils.js');
var stateUtils = require('./StateUtils.js');
var mapControl = require('./MapControl.js');
var loadData = require('./Api.js');
var moment = require('moment')

console.log("Starting up finland yard");

var mapControl = mapControl();

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
    {type: 'police', name: 'Sorjonen', latitude: state.stations[0].latitude, longitude: state.stations[0].longitude },
    {type: 'villain', name: 'Mr. X', latitude: state.stations[1].latitude, longitude: state.stations[1].longitude }
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
        mapControl.drawPolice(stateUtils.getActors(state, 'police'));
        mapControl.drawVillains(stateUtils.getActors(state, 'villain'));
        document.getElementById("clock").innerHTML = state.clockIs.format();

        tick();
      },
      10)})();
});
