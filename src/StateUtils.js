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
  },
  collectConnections: function(state) {
    // Collect every connection
    var allConnections = _.flatten(_.map(state.timetable, function(t) { return t.timeTableRows; })),

    // Map connections with station coordinates
    allConnections = _.map(allConnections, function(entry) {
      var station = module.exports.getStationById(state, entry.stationShortCode);
      return {
        stationShortCode: entry.stationShortCode,
        coords: [station.longitude, station.latitude]
      }
    });

    // Remove duplicates
    allConnections = _.map(_.chunk(allConnections, 2), function(connection) {
      var si = _.join(_.sortBy([connection[0].stationShortCode, connection[1].stationShortCode]), "");
      return {sortIdentifier: si, from: connection[0].coords, to: connection[1].coords};
    });

    // Remove util data
    return _.map(_.uniqBy(allConnections, "sortIdentifier"), function(e) { return _.omit(e, "sortIdentifier");});
  }
}
