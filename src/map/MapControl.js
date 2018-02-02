import R from 'ramda';
import rangeFit from 'range-fit';
import {fabric} from 'fabric'
import CommonUtils from '../state/CommonUtils.js';
import {log} from '../utils/Log';

fabric.Object.prototype.originX = fabric.Object.prototype.originY = 'center';

const MAX_SCORE_DIGITS = 6;

const playerListElement = document.querySelector('.js-players');

const clockElement = document.querySelector('.js-clock');

const scoreElement = document.querySelector('.js-score');

const repeatEmptySegmentMarks = R.repeat('!');

const updateScoreElement = score => {
  const scoreStr = '' + score;
  const emptySegments = repeatEmptySegmentMarks(MAX_SCORE_DIGITS - scoreStr.length);
  scoreElement.innerHTML = emptySegments.join('') + scoreStr;
}

const fitLatitude = v => 900 - rangeFit(v, 58, 68, 0, 900)

const fitLongitude = v => rangeFit(v, 20, 42, 0, 1200)

const createPlayerElement = name => {
  const li = document.createElement('li')
  li.className = 'player'
  li.innerText = name
  return li;
}

const addElementToPlayerList = el => playerListElement.appendChild(el)

export default function() {

  /* Initialize canvases */
  const background = new fabric.StaticCanvas('background', {renderOnAddRemove: false});
  const foreground = new fabric.StaticCanvas('foreground', {renderOnAddRemove: false});
  const game = new fabric.StaticCanvas('game');

  /* Police */
  const policeObjects = {};
  /* Villains */
  const villainObjects = {};
  const villainElements = {};
  /* Name labels */
  const textObjects = {};
  /* Counter for police sirens */
  let policeSirenCounter = 0;

  return {
    drawStations(stations) {
      log("Drawing " + stations.length + " stations");

      stations.forEach(function(station) {
        if(station.passengerTraffic) {
          const stationCircle = new fabric.Circle({
              top: fitLatitude(station.latitude),
              left: fitLongitude(station.longitude),
              radius: 6,
              fill: '#efefef',
              stroke: '#000',
              strokeWidth: 2
          });
          background.add(stationCircle);
        }
      });

      foreground.setBackgroundImage('./static/images/foreground.png', () => foreground.renderAll(), {
        originX: 'left',
        originY: 'top'
      });

      background.renderAll();
    },

    drawConnections(connections) {
      log("Drawing " + connections.length + " connections");

       background.setBackgroundImage('./static/images/background.png', () => background.renderAll(), {
         originX: 'left',
         originY: 'top'
       });

      connections.forEach(function(connection) {
        const d = [fitLongitude(connection.from[0]) + 1, fitLatitude(connection.from[1]) + 1,
                fitLongitude(connection.to[0]) + 1, fitLatitude(connection.to[1]) + 1];

        const line = new fabric.Line(d, {
          stroke: '#000',
          strokeWidth: 12,
          selectable: false
        });

        const circle = new fabric.Circle({
          top : d[3],
          left : d[2],
          radius: 6,
          fill : '#000'
        });

        background.add(line);
        background.add(circle);
      });

      connections.forEach(function(connection) {
        const d = [fitLongitude(connection.from[0]) + 1, fitLatitude(connection.from[1]) + 1,
          fitLongitude(connection.to[0]) + 1, fitLatitude(connection.to[1]) + 1];

        const line = new fabric.Line(d, {
          stroke: '#ff223A',
          strokeWidth: 3,
          selectable: false
        });

        const circle = new fabric.Circle({
          top : d[3],
          left : d[2],
          radius: 1.5,
          fill : '#ff223A'
        });

        background.add(line);
        background.add(circle);
      });
    },

    updateClock(clockIs) {
      clockElement.innerText = clockIs.asString();
    },

    drawPolice(polices) {
      polices.forEach(function(p) {
        if(!policeObjects[p.name]) {
          const police = new fabric.Circle({
              radius: 8
          });

          const text = new fabric.Text(p.name + ' ' + p.destination, {
            top : fitLatitude(p.latitude),
            left : fitLongitude(p.longitude),
            fontSize: 12
          });

          game.add(police);
          game.add(text);

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
      game.renderAll();
    },

    drawVillains(villains) {
      villains.forEach(function(v, index) {
        if(v.caught) {
          if (!v.caughtActionsPerformed) {
            const villainObject = villainObjects[v.name];
            villainObject.set('visible', false);

            const textObject = textObjects[v.name];
            textObject.set('visible', false);

            const element = villainElements[v.name];
            element.className += ' caught';

            v.caughtActionsPerformed = true;
          }

          return;
        }

        if(!villainObjects[v.name]) {
          const villain = new fabric.Circle({
              radius: 8,
              fill : '#33ff00'
          });

          const text = new fabric.Text(v.name + ' ' + v.destination, {
            top: fitLatitude(v.latitude),
            left: fitLongitude(v.longitude),
            fontSize: 12,
            fill: '#fff',
            backgroundColor: '#000'
          });

          const element = createPlayerElement(v.name);

          game.add(villain);
          game.add(text);
          addElementToPlayerList(element);

          villainObjects[v.name] = villain;
          textObjects[v.name] = text;
          villainElements[v.name] = element;
        }

        const villainObject = villainObjects[v.name];
        villainObject.top = fitLatitude(v.latitude);
        villainObject.left = fitLongitude(v.longitude);

        const textObject = textObjects[v.name];
        textObject.top = fitLatitude(v.latitude) - 6;
        textObject.left = fitLongitude(v.longitude) + 6;
        textObject.text = v.name + ' ' + (v.location || '') + (v.destination ? '->' + v.destination : '');

        if (v.isPlayer) {
          updateScoreElement(v.money);
        }
      });
    },

    render() {
      game.renderAll();
    },

    draw(state) {
      this.drawPolice(CommonUtils.getActors(state, 'police'));
      this.drawVillains(CommonUtils.getActors(state, 'villain'));
      this.updateClock(state.clockIs);
      this.render();

      return state;
    }
  }
}
