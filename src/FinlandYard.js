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
import R from 'ramda'

const requireAll = r => r.keys().forEach(r);
requireAll(require.context('./actors/', true, /\.js$/));

log("Starting up finland yard", "system");

const mapControl = MapControl();

var findPolices =(allActors) =>R.filter(R.propEq('type', 'police'))(allActors);

function printPoliceStats(state) {
  const printStats = police => log(`${police.name} caught ${police.stats} villains`, "enemy");
  var polices = findPolices(state.actors);
  R.forEach(printStats, polices);
}

/**
 * Game callback after api-operations
 */
api.loadData(data => {
  if (data.timetable.length === 0) {
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
        printPoliceStats(state);
        log('Game over', 'gameover');
        api.postResults(state.actors, document.getElementById("clock"));
        return;
      } else {
        tick(FyEngine.runGameIteration(mapControl, StateTransformations, state));
      }
    }, 1)
  };

  tick(initialState);
});
