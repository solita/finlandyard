'use strict';

/**
CommonUtils contains common functions for used in various
places. These functions DO NOT alter the state in any way,
and DO NOT require any pre-calculations.

This should only be used internally.

For pre-calculations and user exposed functions, refer to DataUtils.js.
*/

var R = require('ramda');

module.exports = {
  getActors: function(state, type) {
    var result = R.filter(R.propEq('type', type), state.actors);
    return result;
  },
  findLocationsByType: function(state, type, prop) {
    return R.compose(
      R.reject(R.isNil()),
      R.map(R.prop(prop)),
      R.reject(R.propEq('caught', true)))(this.getActors(state, type));
  },
  createCallbackContext: function(state) {
    return {
      knownVillainLocations: this.findLocationsByType(state, 'villain', 'location'),
      knownPoliceLocations: this.findLocationsByType(state, 'police', 'location'),
      knownPoliceDestinations: this.findLocationsByType(state, 'police', 'destination'),
    };
  },
  gameOver: function(state) {
    return R.all(R.propEq('caught', true), this.getActors(state, 'villain'));
  }
}
