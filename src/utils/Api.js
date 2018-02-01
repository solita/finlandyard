import {log} from './Log';

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

function postResults(actors, container) {
  var xhr = new XMLHttpRequest();
  xhr.open( "POST", "http://localhost:8000/results", true );
  xhr.onload = function(e) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        // container.innerHTML = 'Villains caught! THANKS! Results posted to backend.';
      } else {
          console.error(xhr.statusText);
          throw "Couldn't fetch data"
      }
    }
  }
  xhr.send(JSON.stringify(actors));
}

function loadData(fireCallback) {
  var state = {};
  doAsyncJsonRequest("http://localhost:8000/api/v1/metadata/stations", function(stations) {
    log("Stations loaded. " + stations.length + " stations", "system");
    state.stations = stations;
  });
  doAsyncJsonRequest("http://localhost:8000/api/v1/schedules?departure_date=2017-11-01", function(timetable) {
    log("Timetable loaded. Contains " + timetable.length, "system");
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

module.exports = {
  loadData: loadData,
  postResults: postResults
};
