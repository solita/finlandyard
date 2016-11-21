var ol = require('openlayers');
require('../node_modules/openlayers/css/ol.css');

// TODO: tämän voisi erottaa vielä omaan filuunsa (olisi siis esim Map.js ja MapControl.js)
function initMap(stationSource, connectionSource, policeSource, thieveSource, attribution) {
  // Varsinainen karttaotus
  console.log("Initializing map");
  var map = new ol.Map({
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      }),
      // Asemat
      new ol.layer.Vector({
        source: stationSource,
        style: new ol.style.Style({
          image: new ol.style.Circle({
            radius: 1,
            fill: new ol.style.Fill({color: 'black'}),
            stroke: new ol.style.Stroke({color: 'black', width: 1})
          })
        })
      }),
      // Yhteydet
      new ol.layer.Vector({ //Layer for connections
        source: connectionSource,
        style: new ol.style.Style({
          stroke: new ol.style.Stroke({
            color: 'red',
            width: 1
          })
        })
      }),
      // Poliisit
      new ol.layer.Vector({
        source: policeSource,
        style: new ol.style.Style({
          image: new ol.style.Circle({
            radius: 3,
            fill: new ol.style.Fill({color: 'blue'}),
            stroke: new ol.style.Stroke({color: 'blue', width: 1})
          })
        })
      }),
      // Rosvot
      new ol.layer.Vector({
        source: thieveSource,
        style: new ol.style.Style({
          image: new ol.style.Circle({
            radius: 3,
            fill: new ol.style.Fill({color: 'red'}),
            stroke: new ol.style.Stroke({color: 'red', width: 1})
          })
        })
      })
    ],
    controls: ol.control.defaults({attribution: false}).extend([attribution]),
    target: 'map',
    view: new ol.View({
      center: ol.proj.fromLonLat([25.9241, 64.7482]),
      zoom: 5
    })
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
  initMap(stationSource, connectionSource, policeSource, thieveSource, attribution);

  // Return object for commanding sources with access to state closure
  return {
    drawStations: function(stations) {
        stationSource.addFeatures(_.map(stations, function(station) {
          return new ol.Feature({
                'geometry': new ol.geom.Point(ol.proj.fromLonLat([station.longitude, station.latitude]))
              });
        }));
    }
  }
}
