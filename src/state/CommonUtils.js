'use strict';
var R = require('ramda');

module.exports = {
  getActors: function(state, type) {
    var result = R.filter(R.propEq('type', type), state.actors);
    return result;
  }
}
