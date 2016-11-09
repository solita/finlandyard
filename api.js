/**
 * Returns station by id
 */
function getStationById(state, id) {
  return _.find(state.stations, function(s) {
    return s.stationShortCode === id;
  });
}

/**
 * Return all distinct connections from state.
 *
 * {HKI: [PASILA], TRE: [JKL, RMK]}
 *
 * Tää homma vaatii vähän pohtimista vieläkin..
 */
function reduceConnections(state) {
  // They said functional programming is clean and nice...
  var separateConnections = _.chunk(
    _.flatten(
      _.map(state.timetable,
        function(t) {
          return _.map(t.timeTableRows, function(r) {
            return r.stationShortCode; })
          })),
      2);

  return _.reduce(separateConnections,
    function(acc, conn) {
      if(!acc[conn[0]]) {
        acc[conn[0]] = [];
      }
      if(!_.some(acc[conn[0]], function(a) { return a === conn[1]})) {
        acc[conn[0]].push(conn[1]);
      }
      return acc;
    },
    {});
}

var feature_constructor = {
  stationsToFeature: function(stations, stationsSource) {
    stationsSource.addFeatures(_.map(stations, function(station) {
      return new ol.Feature({
            'geometry': new ol.geom.Point(ol.proj.fromLonLat([station.longitude, station.latitude]))
          });
    }));
  },
  connectionsToFeature: function(state, connections, connectionsSource) {
    var features = _.reduce(connections, function(acc, toStations, fromStation) {
      var fs = getStationById(state, fromStation);
      var lines = _.map(toStations, function(t) {
        var to  = getStationById(state, t);
        return new ol.Feature({
          'geometry': new ol.geom.LineString([ol.proj.fromLonLat([fs.longitude, fs.latitude]), ol.proj.fromLonLat([to.longitude, to.latitude])])
        });
      });
      return acc.concat(lines);
    }, []);
    connectionsSource.addFeatures(features);
  }
}

function doAsyncJsonRequest(url, cb) {
  var xhr = new XMLHttpRequest();
  xhr.open( "GET", url, true );
  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
          cb(JSON.parse(xhr.responseText));
      } else {
          console.error(xhr.statusText);
          throw "Couldn't fetch data"
      }
    }
  }
  xhr.send(null);
}

function loadData(fireCallback) {
  var state = {};
  doAsyncJsonRequest("http://cors-anywhere.herokuapp.com/https://rata.digitraffic.fi/api/v1/metadata/stations", function(stations) {
    console.log("Stations loaded. " + stations.length + " stations");
    state.stations = stations;
  });
  doAsyncJsonRequest("http://cors-anywhere.herokuapp.com/https://rata.digitraffic.fi/api/v1/schedules?departure_date=2015-03-01", function(timetable) {
    console.log("Timetable loaded. Contains " + timetable.length);
    state.timetable = timetable;
  });
  (function sleep() {
    setTimeout(
      function() {
        if(state.stations && state.timetable) {
          fireCallback(state);
          return;
        }
        sleep();
      },
      100)})();
}
