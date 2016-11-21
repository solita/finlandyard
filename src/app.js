require('file?name=[name].[ext]!./index.html');
var stateUtils = require('./StateUtils.js');
var mapControl = require('./MapControl.js');
var loadData = require('./Api.js');

console.log("Starting up finland yard");

var mapControl = mapControl();

loadData(function(state) {
  mapControl.drawConnections(stateUtils.collectConnections(state));
  mapControl.drawStations(state.stations);
});
