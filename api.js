// TEMP STUFF, code under src and spec

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

function getTrainsLeavingFromStation(state, station) {
  return _.filter(state.timetable, function(route) {
    return _.filter(route.timeTableRows, function(tbr) {
      if(tbr.type === 'DEPARTURE') {
        return tbr.stationShortCode === station;
      }
      return false;
    }).length > 0;
  });
}

function arrivalTimeToDestination(travellingActor) {
    var a = _.find(travellingActor.train.timeTableRows, function(entry) {
      return entry.stationShortCode === travellingActor.location;
    });

    return moment(a.scheduledTime);
}

function leavingTime(travellingActor) {
    var a = _.find(travellingActor.train.timeTableRows, function(entry) {
      return entry.stationShortCode === travellingActor.location;
    });

    return moment(a.scheduledTime);
}

function haltArrivedActors(time, actors) {
  return _.map(actors, function(actor) {
    if(actor.state === 'TRAVELLING'){
      var arrivalTime = arrivalTimeToDestination(actor);
      if(arrivalTime.unix() === time.unix()) {
        console.log(actor.id + " has arrived to " + actor.location);
        return { id: actor.id, location: actor.location, state: 'IDLE'};
      }
    }
    if(actor.state === 'IDLE' && actor.train) {
      var departureTime = leavingTime(actor);
      if(departureTime.unix() === time.unix()) {
        var destination = _.last(actor.train.timeTableRows).stationShortCode;
        console.log(actor.id + " train departures to " + destination);
        return { id: actor.id, location: destination, train: actor.train, state: "TRAVELLING" };
      }
    }
    return actor;
  });
}

function stateChanges(state) {
  state.police = haltArrivedActors(state.clockIs, state.police);
  state.thieves = haltArrivedActors(state.clockIs, state.thieves);

  return state;
}

function randomSelectionOfNextTrain(state, actor) {
  if(actor.state === 'IDLE' && !actor.train) {
    var trainsLeaving = getTrainsLeavingFromStation(state, actor.location);
    var na = {id: actor.id, state: 'IDLE', location: actor.location, train: _.sample(trainsLeaving)}

    console.log(na.id + " decides to leave to " + _.last(na.train.timeTableRows).stationShortCode);
    return na;
  }
  return actor;
}

// Tätä ei oikeasti pidä toteuttaa näin
function applyAI(state) {
  state.police = _.map(state.police, function(actor) { return randomSelectionOfNextTrain(state, actor); });
  state.thieves = _.map(state.thieves, function(actor) { return randomSelectionOfNextTrain(state, actor); });
  return state;
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
  stationsToFeature: function(state, stationsSource) {
    var connections = _.keys(reduceConnections(state));

    stationsSource.addFeatures(_.map(_.filter(state.stations, function(s) { return _.some(connections, function(a) { return a === s.stationShortCode; } ); }), function(station) {
      return new ol.Feature({
            'geometry': new ol.geom.Point(ol.proj.fromLonLat([station.longitude, station.latitude]))
          });
    }));
  },
  connectionsToFeature: function(state, connectionsSource) {
    var connections = reduceConnections(state);
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
          return e.type == 'DEPARTURE' || e.type == 'ARRIVAL';
        });
        var now = state.clockIs.unix();
        var start = null;
        var end = null;
        for(var i = 0; i < timetable.length; i++) {
          if(moment(timetable[i].scheduledTime).unix() <= now &&
             timetable[i + 1] &&
             moment(timetable[i + 1].scheduledTime).unix() >= now ) {
              start = timetable[i];
              end = timetable[i + 1];
              break;
            }
          // Mitähän käy jos ei löydy...
        //  throw "Reitin rendaaminen meni reisille"
        }
        if(start == null || end == null) {
          return;
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
    source.addFeatures(_.filter(features, function(f) { return f != null; } ));
    //source.addFeatures(features);
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
