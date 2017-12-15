'use strict';

var R = require('ramda');
var rangeFit = require('range-fit');
var fabric = require('fabric').fabric;

var canvas = new fabric.StaticCanvas('canvas');

function fitLatitude(v) {
  return 1000 - rangeFit(v, 58, 68, 0, 1000);
}
function fitLongitude(v) {
  return rangeFit(v, 20, 42, 0, 1000);
}

var policeObjects = {};
var villainObjects = {};
var textObjects = {};

module.exports = function() {

  // Return object for commanding sources with access to state closure
  // We do not expose sources directly
  return {
    drawStations: function(stations) {
      console.log("Drawing " + stations.length + " stations");
      stations.forEach(function(station) {
        if(station.passengerTraffic) {
          var stationCircle = new fabric.Circle({
              top : fitLatitude(station.latitude),
              left : fitLongitude(station.longitude),
              radius: 1.2,
              fill : 'black'
          });
          canvas.add(stationCircle);
        }

      });

    },
    drawConnections: function(connections) {
      console.log("Drawing " + connections.length + " connections");

      connections.forEach(function(connection) {
        var d = [fitLongitude(connection.from[0]) + 1, fitLatitude(connection.from[1]) + 1,
                fitLongitude(connection.to[0]) + 1, fitLatitude(connection.to[1]) + 1];
        var line = new fabric.Line(d, {
          fill: 'red',
          stroke: 'green',
          strokeWidth: 1,
          selectable: false
        });
        canvas.add(line);
      });

    },
    drawPolice: function(polices) {
      polices.forEach(function(p) {
        if(!policeObjects[p.name]) {
          var police = new fabric.Circle({
              top : fitLatitude(p.latitude),
              left : fitLongitude(p.longitude),
              radius: 2,
              fill : 'blue'
          });
          var text = new fabric.Text(p.name + ' ' + p.destination, {
            top : fitLatitude(p.latitude),
            left : fitLongitude(p.longitude),
            fontSize: 12
          });
          canvas.add(police);
          canvas.add(text);
          policeObjects[p.name] = police;
          textObjects[p.name] = text;
        }
        var policeObject = policeObjects[p.name];
        policeObject.top = fitLatitude(p.latitude);
        policeObject.left = fitLongitude(p.longitude);
        var textObject = textObjects[p.name];
        textObject.top = fitLatitude(p.latitude);
        textObject.left = fitLongitude(p.longitude);
      });
      canvas.renderAll();
    },
    drawVillains: function(villains) {
      villains.forEach(function(v) {
        if(!villainObjects[v.name]) {
          var villain = new fabric.Circle({
              top : fitLatitude(v.latitude) + 20,
              left : fitLongitude(v.longitude) - 20,
              radius: 2,
              fill : 'red'
          });
          var text = new fabric.Text(v.name + ' ' + v.destination, {
            top : fitLatitude(v.latitude),
            left : fitLongitude(v.longitude),
            fontSize: 12
          });
          canvas.add(villain);
          canvas.add(text);
          villainObjects[v.name] = villain;
          textObjects[v.name] = text;
        }
        var villainObject = villainObjects[v.name];
        villainObject.top = fitLatitude(v.latitude);
        villainObject.left = fitLongitude(v.longitude);
        var textObject = textObjects[v.name];
        textObject.top = fitLatitude(v.latitude);
        textObject.left = fitLongitude(v.longitude);
      });
      canvas.renderAll();
    }
  }
}
