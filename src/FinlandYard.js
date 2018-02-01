import 'file-loader?name=[name].[ext]!./index.html';
import dataUtils from './state/DataUtils.js';
import CommonUtils from './state/CommonUtils.js';
import StateTransformations from './engine/StateTransformations.js';
import FyEngine from './engine/FyEngine.js';
import MapControl from './map/MapControl.js';
import api from './utils/Api.js';
import ActorBridge from './ActorBridge.js';
import clock from './Clock.js';
import {log} from './utils/Log';

const requireAll = r => r.keys().forEach(r);
requireAll(require.context('./actors/', true, /\.js$/));

log("Starting up finland yard");

const mapControl = MapControl();

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
  const initialState = {
    actors: ActorBridge.actors(),
    clockIs: clock(7, 0)
  };

  // Run the game loop
  const tick = state => {
    setTimeout(() => {
      if(CommonUtils.gameOver(state)) {
        log('Game over');
        api.postResults(state.actors, document.getElementById("clock"));
        return;
      } else {
        tick(FyEngine.runGameIteration(mapControl, StateTransformations, state));
      }
    }, 1)
  };

  tick(initialState);
});
