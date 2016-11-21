require('file?name=[name].[ext]!./index.html');
require('./StateUtils.js');
var map = require('./Map.js');
var loadData = require('./Api.js');

console.log("Starting up finland yard");

var map = map();

loadData(function(data) {
  map.drawStations(data.stations);
});
