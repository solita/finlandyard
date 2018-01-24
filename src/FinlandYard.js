'use strict';

require('file-loader?name=[name].[ext]!./index.html');
var dataUtils = require('./state/DataUtils.js');
var CommonUtils = require('./state/CommonUtils.js');
var StateTransformations = require('./engine/StateTransformations.js');
var FyEngine = require('./engine/FyEngine.js');
var mapControl = require('./map/MapControl.js');
var log = require('./utils/Log.js');
var api = require('./utils/Api.js');
var ActorBridge = require('./ActorBridge.js');
var clock = require('./Clock.js');

function requireAll(r) { r.keys().forEach(r); }
requireAll(require.context('./actors/', true, /\.js$/));

console.log("Starting up finland yard");

var mapControl = mapControl();

/**
 * Game callback after api-operations
 */
api.loadData(function(data) {
  if(data.timetable.length === 0) {
    console.error("No timetable rows found from api");
    return;
  }

  // Init dataUtils
  dataUtils.initData(data);

  // Draw initial canvas
  mapControl.drawConnections(dataUtils.collectConnections());
  mapControl.drawStations(dataUtils.connectedStations());

  // Initialize initial state
  var initialState = {};
  initialState.actors = ActorBridge.actors();
  initialState.clockIs = clock(7, 0);

  // Run the game loop
  (function tick(state) {
    setTimeout(
      function() {
        if(CommonUtils.gameOver(state)) {
          console.log('Game over');
          api.postResults(state.actors, document.getElementById("clock"));
          return;
        } else {
          tick(FyEngine.runGameIteration(mapControl, StateTransformations, state));
        }
      }, 1)})(initialState);
});
