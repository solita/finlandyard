import R from 'ramda';
import rangeFit from 'range-fit';
import {fabric} from 'fabric'
import CommonUtils from '../state/CommonUtils.js';

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

const fitLatitude = v => 1000 - rangeFit(v, 58, 68, 0, 1000)

const fitLongitude = v => rangeFit(v, 20, 42, 0, 1000)

export default function() {

  /* The canvas */
  const canvas = new fabric.StaticCanvas('canvas');

  /* Clock render object */
  const clockObject = new fabric.Text('', {
    top : 250,
    left : 400,
    fontSize: 12
  });

  canvas.add(clockObject);

  /* Polices */
  const policeObjects = {};
  /* Villains */
  const villainObjects = {};
  /* Name labels */
  const textObjects = {};
  /* Money objects */
  const moneyObjects = {};
  /* Counter for police sirens */
  let policeSirenCounter = 0;

  return {
    drawStations(stations) {
      console.log("Drawing " + stations.length + " stations");

      stations.forEach(function(station) {
        if(station.passengerTraffic) {
          const stationCircle = new fabric.Circle({
              top : fitLatitude(station.latitude),
              left : fitLongitude(station.longitude),
              radius: 4,
              fill: '#f1d6b9',
              stroke: '#705122',
              strokeWidth: 2
          });
          canvas.add(stationCircle);
        }

      });
    },

    drawConnections(connections) {
      console.log("Drawing " + connections.length + " connections");

      connections.forEach(function(connection) {
        const d = [fitLongitude(connection.from[0]) + 1, fitLatitude(connection.from[1]) + 1,
                fitLongitude(connection.to[0]) + 1, fitLatitude(connection.to[1]) + 1];

        const line = new fabric.Line(d, {
          stroke: '#fff1cb',
          strokeWidth: 10,
          selectable: false
        });

        const circle = new fabric.Circle({
          top : d[3],
          left : d[2],
          radius: 5,
          fill : '#fff1cb'
        });

        canvas.add(line);
        canvas.add(circle);
      });

      connections.forEach(function(connection) {
        const d = [fitLongitude(connection.from[0]) + 1, fitLatitude(connection.from[1]) + 1,
          fitLongitude(connection.to[0]) + 1, fitLatitude(connection.to[1]) + 1];

        const line = new fabric.Line(d, {
          stroke: '#9a9253',
          strokeWidth: 2,
          selectable: false
        });

        const circle = new fabric.Circle({
          top : d[3],
          left : d[2],
          radius: 1,
          fill : '#9a9253'
        });

        canvas.add(line);
        canvas.add(circle);
      });
    },

    drawClock(clockIs) {
      clockObject.text = clockIs.asString();
    },

    drawPolice(polices) {
      polices.forEach(function(p) {
        if(!policeObjects[p.name]) {
          const police = new fabric.Circle({
              radius: 2
          });

          const text = new fabric.Text(p.name + ' ' + p.destination, {
            top : fitLatitude(p.latitude),
            left : fitLongitude(p.longitude),
            fontSize: 12
          });

          canvas.add(police);
          canvas.add(text);

          policeObjects[p.name] = police;
          textObjects[p.name] = text;
        }
        const policeObject = policeObjects[p.name];
        policeObject.top = fitLatitude(p.latitude);
        policeObject.left = fitLongitude(p.longitude);
        policeObject.set({fill: policeSirenCounter < 10 ? 'blue' : 'red'});


        const textObject = textObjects[p.name];
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

    drawVillains(villains) {
      villains.forEach(function(v, index) {
        if(v.caught) {
          const textObject = textObjects[v.name];
          textObject.setColor('#ccc');
          const moneyObject = moneyObjects[v.name];
          moneyObject.text = v.name + ': ' + v.money;
          moneyObject.setColor('#ccc');
          return;
        }

        if(!villainObjects[v.name]) {
          const villain = new fabric.Circle({
              radius: 2,
              fill : 'green'
          });

          const text = new fabric.Text(v.name + ' ' + v.destination, {
            top : fitLatitude(v.latitude),
            left : fitLongitude(v.longitude),
            fontSize: 12
          });

          const money = new fabric.Text(v.name + ' ' + v.money, {
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

        const villainObject = villainObjects[v.name];
        villainObject.top = fitLatitude(v.latitude);
        villainObject.left = fitLongitude(v.longitude);

        const textObject = textObjects[v.name];
        textObject.top = fitLatitude(v.latitude) - 6;
        textObject.left = fitLongitude(v.longitude) + 6;
        textObject.text = v.name + ' ' + (v.location || '') + (v.destination ? '->' + v.destination : '');

        const moneyObject = moneyObjects[v.name];
        moneyObject.text = v.name + ': ' + v.money;
      });
    },

    render() {
      canvas.renderAll();
    },

    draw(state) {
      this.drawPolice(CommonUtils.getActors(state, 'police'));
      this.drawVillains(CommonUtils.getActors(state, 'villain'));
      this.drawClock(state.clockIs);
      this.render();

      return state;
    }
  }
}
