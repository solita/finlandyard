require('file?name=[name].[ext]!./index.html');
var dataUtils = require('./DataUtils.js');
var mapControl = require('./MapControl.js');
var loadData = require('./Api.js');
var moment = require('moment')

console.log("Starting up finland yard");

var mapControl = mapControl();

loadData(function(state) {
  var startingTime = moment(state.timetable[0].timeTableRows[0].scheduledTime);
  state.clockIs = startingTime.clone();
  mapControl.drawConnections(dataUtils.collectConnections(state));
  mapControl.drawStations(dataUtils.connectedStations(state));

  // THE game loop
  (function tick() {
    setTimeout(
      function() {
        // Edistä kelloa
        state.clockIs = state.clockIs.add(1, 'minutes');
        if(state.clockIs.unix() - startingTime.unix() > 1 * 24 * 60 * 60) {
          state.clockIs = startingTime.clone();
        }
        document.getElementById("clock").innerHTML = state.clockIs.format();

        tick();
      },
      10)})();
});
