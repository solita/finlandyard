/**
 * Returns station by id
 */
function getStationById(state, id) {
  var a = _.find(state.stations, function(s) {
    return s.stationShortCode === id;
  });
  if(a) {
    return a;
  }
  throw "No such station: " + id;
}

function getStations(state, timeTableRows) {
  var a = _.find(state.timetable, function(train) {
    return train.trainNumber === trainId;
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
  },
  drawActors: function(state, actors, source) {
    source.clear();
    var features = _.map(actors, function(actor) {
      if(actor.state === 'IDLE') {
        var station = getStationById(state, actor.location);
        return new ol.Feature({
          'geometry': new ol.geom.Point(ol.proj.fromLonLat([station.longitude, station.latitude]))
        });
      }
      if(actor.state === 'TRAVELLING') {
        // joutuu tällä erää filteroidä arrivalit näin pois
        var timetable = _.filter(actor.train.timeTableRows, function(e) {
          return e.type == 'DEPARTURE';
        });
        var now = state.clockIs.unix();
        var start = null;
        var end = null;
        for(var i = 0; i < timetable.length; i++) {
          if(moment(timetable[i].scheduledTime).unix() <= now &&
            moment(timetable[i + 1].scheduledTime).unix() >= now ) {
              start = timetable[i];
              end = timetable[i + 1];
              break;
            }
          // Mitähän käy jos ei löydy...
        //  throw "Reitin rendaaminen meni reisille"
        }
        var s = getStationById(state, start.stationShortCode);
        var d =  getStationById(state, end.stationShortCode);
        var leaving = moment(start.scheduledTime).unix();
        var arriving = moment(end.scheduledTime).unix();

        var porpotion = 1 - (arriving - now) / (arriving - leaving);

        return new ol.Feature({
          'geometry':
              new ol.geom.Point(ol.proj.fromLonLat(
                [s.longitude + porpotion * (d.longitude - s.longitude),
                 s.latitude + porpotion * (d.latitude - s.latitude)]))
        });
      }
    });
    source.addFeatures(features);
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
