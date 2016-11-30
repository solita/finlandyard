'use strict';
var _ = require('lodash');

module.exports = {
  getActors: function(state, type) {
    return _.filter(state.actors, function(actor) { return actor.type === type; } );
  }
}
