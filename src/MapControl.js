var map = require('./Map.js');
var ol = require('openlayers');

module.exports = function() {
  // Closure for holding source states
  var stationSource = new ol.source.Vector({
    wrapX: false
  });

  var connectionSource = new ol.source.Vector({
      wrapX: false
  });

  var policeSource = new ol.source.Vector({
      wrapX: false
  });

  var thieveSource = new ol.source.Vector({
      wrapX: false
  });

  var attribution = new ol.control.Attribution({
    collapsible: false
  });

  // Initialize map
  map(stationSource, connectionSource, policeSource, thieveSource, attribution);

  // Return object for commanding sources with access to state closure
  // We do not expose sources directly
  return {
    drawStations: function(stations) {
      stationSource.addFeatures(_.map(stations, function(station) {
        return new ol.Feature({
              'geometry': new ol.geom.Point(ol.proj.fromLonLat([station.longitude, station.latitude]))
            });
      }));
    },
    drawConnections: function(connections) {
      var features = _.map(connections, function(connection){
          return new ol.Feature({
            'geometry': new ol.geom.LineString([ol.proj.fromLonLat(connection.from), ol.proj.fromLonLat(connection.to)])
          });
        });

      connectionSource.addFeatures(features);
    }
  }
}
