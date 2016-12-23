'use strict';

var map = require('./Map.js');
var ol = require('openlayers');
var R = require('ramda');

var stationToFeature = (station) => new ol.Feature({
  'geometry': new ol.geom.Point(ol.proj.fromLonLat([station.longitude, station.latitude]))
});

var connectionToFeature = (connection) => new ol.Feature({
  'geometry': new ol.geom.LineString([ol.proj.fromLonLat(connection.from), ol.proj.fromLonLat(connection.to)])
});

var actorToFeature = (actor) => new ol.Feature({
  'geometry': new ol.geom.Point(ol.proj.fromLonLat([actor.longitude, actor.latitude]))
});


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

  var villainSource = new ol.source.Vector({
      wrapX: false
  });

  var attribution = new ol.control.Attribution({
    collapsible: false
  });

  // Initialize map
  map(stationSource, connectionSource, policeSource, villainSource, attribution);

  // Return object for commanding sources with access to state closure
  // We do not expose sources directly
  return {
    drawStations: function(stations) {
      console.log("Drawing " + stations.length + " stations");
      stationSource.addFeatures(R.map(stationToFeature, stations));
    },
    drawConnections: function(connections) {
      console.log("Drawing " + connections.length + " connections");
      connectionSource.addFeatures(R.map(connectionToFeature, connections));
    },
    drawPolice: function(police) {
      policeSource.clear();
      policeSource.addFeatures(R.map(actorToFeature, police));
    },
    drawVillains: function(villains) {
      villainSource.clear();
      villainSource.addFeatures(R.map(actorToFeature, villains));
    }
  }
}
