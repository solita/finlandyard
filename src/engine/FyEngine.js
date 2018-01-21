const R = require('ramda');
const stateTransformations = require('./StateTransformations.js');

const getLocations = (state, type, prop) => R.compose(
        R.reject(R.isNil()),
        R.map(R.prop(prop)),
        R.reject(R.propEq('caught', true)))(stateTransformations.getActors(state, type));

const createContext = (state) => {
  return {
    knownVillainLocations: getLocations(state, 'villain', 'location'),
    knownPoliceLocations: getLocations(state, 'police', 'location'),
    knownPoliceDestinations: getLocations(state, 'police', 'destination'),
  };
}

const applyAI = (state)=> {
  return R.map((actor) => {
    if(actor.caught || actor.train) {
      return actor;
    }
    return actor.aifn(state.clockIs.clone(), createContext(state), actor)(actor);
  });
}

module.exports = {
  runGameIteration: function(drawFn, stateTrasformations, state) {
    state.clockIs.tick();
    state = R.evolve({'actors': applyAI(state)}, state);
    return drawFn.draw(stateTrasformations.applyRound(state));
  }
}
