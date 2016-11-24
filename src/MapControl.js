'use strict';

var map = require('./Map.js');
var ol = require('openlayers');

function stationToFeature(station) {
  return new ol.Feature({
    'geometry': new ol.geom.Point(ol.proj.fromLonLat([station.longitude, station.latitude]))
  });
}

function connectionToFeature(connection) {
  return new ol.Feature({
    'geometry': new ol.geom.LineString([ol.proj.fromLonLat(connection.from), ol.proj.fromLonLat(connection.to)])
  });
}

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
      console.log("Drawing " + stations.length + " stations");
      stationSource.addFeatures(_.map(stations, stationToFeature));
    },
    drawConnections: function(connections) {
      console.log("Drawing " + connections.length + " connections");
      connectionSource.addFeatures(_.map(connections, connectionToFeature));
    }
  }
}
