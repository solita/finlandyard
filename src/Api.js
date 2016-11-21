// LUL WUT? Why yuno promise?

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

module.exports = loadData;
