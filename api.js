var feature_constructor = {
  stationsToFeature: function(stations, stationsSource) {
    stationsSource.addFeatures(_.map(stations, function(station) {
      return new ol.Feature({
            'geometry': new ol.geom.Point(ol.proj.fromLonLat([station.longitude, station.latitude]))
          });
    }));
  },
  connectionsToFeature: function(connections, connectionsSource) {
    // nyt piirtää vaan jonkun suoran viivan
    connectionsSource.addFeatures([
      new ol.Feature({
        'geometry': new ol.geom.LineString([ol.proj.fromLonLat([25.3241, 64.7482]), ol.proj.fromLonLat([25.9245, 64.9485])])
      })
    ]);
  }
}

var api_bridge = function() {
  var cache = {};
  return {
      _doAsyncJsonRequest: function(cacheKey, url, cb) {
        if(cache[cacheKey]) {
          cb(cache[cacheKey]);
        }
        var xhr = new XMLHttpRequest();
        xhr.open( "GET", url, true );
        xhr.onload = function(e) {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                cache[cacheKey] = JSON.parse(xhr.responseText);
                cb(cache[cacheKey]);
            } else {
                console.error(xhr.statusText);
                throw "Couldn't fetch data"
            }
          }
        }
        xhr.send(null);
      },
      getStationFeatures: function(stationsSource) {
        api_bridge._doAsyncJsonRequest("stations", "http://cors-anywhere.herokuapp.com/https://rata.digitraffic.fi/api/v1/metadata/stations", function(stations) {
          console.log("Stations loaded. " + stations.length + " stations");
          feature_constructor.stationsToFeature(stations, stationsSource);
        });
      },
      getConnectionFeatures: function(connectionSource) {
        // tässä pitäisi leipoa kaikki yhteydet asemien välillä
        api_bridge._doAsyncJsonRequest("timetable", "http://cors-anywhere.herokuapp.com/https://rata.digitraffic.fi/api/v1/schedules?departure_date=2015-03-01", function(timetable) {
          console.log("Timetable loaded. Contains " + timetable.length);
          feature_constructor.connectionsToFeature(timetable, connectionSource);
        });
      }
  };
}();
