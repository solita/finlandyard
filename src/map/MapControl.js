'use strict';

const R = require('ramda');
const rangeFit = require('range-fit');
const fabric = require('fabric').fabric;
const CommonUtils = require('../state/CommonUtils.js');


function fitLatitude(v) {
  return 1000 - rangeFit(v, 58, 68, 0, 1000);
}
function fitLongitude(v) {
  return rangeFit(v, 20, 42, 0, 1000);
}

module.exports = function() {

  /* The canvas */
  var canvas = new fabric.StaticCanvas('canvas');

  /* Clock render object */
  var clockObject = new fabric.Text('', {
    top : 250,
    left : 400,
    fontSize: 12
  });
  canvas.add(clockObject);

  /* Polices */
  var policeObjects = {};
  /* Villains */
  var villainObjects = {};
  /* Name labels */
  var textObjects = {};
  /* Money objects */
  var moneyObjects = {};
  /* Counter for police sirens */
  var policeSirenCounter = 0;

  return {
    drawStations: function(stations) {
      console.log("Drawing " + stations.length + " stations");
      stations.forEach(function(station) {
        if(station.passengerTraffic) {
          var stationCircle = new fabric.Circle({
              top : fitLatitude(station.latitude),
              left : fitLongitude(station.longitude),
              radius: 1,
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
          stroke: '#aaa',
          strokeWidth: 1,
          selectable: false
        });
        canvas.add(line);
      });

    },
    drawClock: function(clockIs) {
      clockObject.text = clockIs.asString();
    },
    drawPolice: function(polices) {
      polices.forEach(function(p) {
        if(!policeObjects[p.name]) {
          var police = new fabric.Circle({
              radius: 2
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
        policeObject.set({fill: policeSirenCounter < 10 ? 'blue' : 'red'});


        var textObject = textObjects[p.name];
        textObject.top = fitLatitude(p.latitude) - 6;
        textObject.left = fitLongitude(p.longitude) + 6;
        textObject.text = p.name + ' ' + (p.location || '') + (p.destination ? '->' + p.destination : '');
        textObject.setColor(policeSirenCounter > 10 ? 'blue' : 'red');
        policeSirenCounter++;
        if(policeSirenCounter === 20) {
          policeSirenCounter = 0;
        }
      });
      canvas.renderAll();
    },

    drawVillains: function(villains) {
      villains.forEach(function(v, index) {
        if(v.caught) {
          var textObject = textObjects[v.name];
          textObject.setColor('#ccc');
          var moneyObject = moneyObjects[v.name];
          moneyObject.text = v.name + ': ' + v.money;
          moneyObject.setColor('#ccc');
          return;
        }
        if(!villainObjects[v.name]) {
          var villain = new fabric.Circle({
              radius: 2,
              fill : 'green'
          });
          var text = new fabric.Text(v.name + ' ' + v.destination, {
            top : fitLatitude(v.latitude),
            left : fitLongitude(v.longitude),
            fontSize: 12
          });
          var money = new fabric.Text(v.name + ' ' + v.money, {
            top : 300 + (index * 12),
            left : 600,
            fontSize: 12
          });

          canvas.add(villain);
          canvas.add(text);
          canvas.add(money);
          villainObjects[v.name] = villain;
          textObjects[v.name] = text;
          moneyObjects[v.name] = money;
        }
        var villainObject = villainObjects[v.name];
        villainObject.top = fitLatitude(v.latitude);
        villainObject.left = fitLongitude(v.longitude);
        var textObject = textObjects[v.name];
        textObject.top = fitLatitude(v.latitude) - 6;
        textObject.left = fitLongitude(v.longitude) + 6;
        textObject.text = v.name + ' ' + (v.location || '') + (v.destination ? '->' + v.destination : '');
        var moneyObject = moneyObjects[v.name];
        moneyObject.text = v.name + ': ' + v.money;
      });
    },
    render: function() {
      canvas.renderAll();
    },
    draw: function(state) {
      this.drawPolice(CommonUtils.getActors(state, 'police'));
      this.drawVillains(CommonUtils.getActors(state, 'villain'));
      this.drawClock(state.clockIs);
      this.render();
      return state;
    }
  }
}
