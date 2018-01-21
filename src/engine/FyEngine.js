'use strict';

/**
The main game iteration function.

drawClosure -> stateChangeClosure -> state -> state
*/

const R = require('ramda');
const CommonUtils = require('../state/CommonUtils.js');

// Applies AI functions by creating context AND evaluating Action AI function invokes
const applyAI = (state)=> {
  return R.map((actor) => {
    if(actor.caught || actor.train) {
      return actor;
    }
    return actor.aifn(state.clockIs.clone(), CommonUtils.createCallbackContext(state), actor)(actor);
  });
}

module.exports = {
  runGameIteration: function(drawClosure, stateChangeClosure, state) {
    state.clockIs.tick();
    state = R.evolve({'actors': applyAI(state)}, state);
    return drawClosure.draw(stateChangeClosure.applyRound(state));
  }
}
