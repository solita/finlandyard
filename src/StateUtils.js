var _ = require('lodash');

module.exports = {
  getStationById: function(state, id) {
    var a = _.find(state.stations, function(s) {
      return s.stationShortCode === id;
    });
    if(a) {
      return a;
    }
    throw Error("No such station: " + id);
  }
}
