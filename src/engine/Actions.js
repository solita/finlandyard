var R = require('ramda');

/**
Actions are functions for actors, which define single action.
This module exposes functions which return another functions
which are then evaluated by the engine.

Warning: contains heavy ramda porn and closures */

/** Returns trainNumber if arg is object, else identity */
const getTrainId = R.ifElse(R.is(Object), R.prop('trainNumber'), R.identity);

module.exports = {
  idle: function() {
    return R.identity;
  },
  train: function(train, stationShortCode) {
    return R.compose(
      R.assoc('train', getTrainId(train)), 
      R.assoc('destination', stationShortCode));
  },
  crime: function() {
    return R.over(R.lensProp('money'), R.inc);
  }
}
