/**
 * Created by anniinasa on 13/04/17.
 */
var dataUtils = require('./state/DataUtils.js');
var R = require('ramda');


var runDijkstra = (clockIs,from, to) => {
  grid=getInitialMatrix(from);
  shortestPath=[]
  unDiscovered=[]
  startStation=R.find(R.propEq('current', true))(grid)
  unDiscovered.push(startStation)
  //console.log(grid)
  while(unDiscovered.length > 0) {
    currentNode=unDiscovered.pop()
    shortestPath.push(currentNode)
    neighbors=getNeighborsWithDistances(clockIs, currentNode)
    console.log(neighbors)


  }
}

function getNeighborsWithDistances(clockIs, currentNode) {
  trains=dataUtils.trainsLeavingFrom(clockIs, currentNode.name)
  console.log(trains)

  var lenss = R.lensProp('timeTableRows')
  filteredTrains=R.map(train => R.set(lenss, R.filter(R.propEq('type', 'ARRIVAL'),train.timeTableRows),train))(trains);

  neighbors=[]
  for(i=0; i < trains.length; i++) {
    firstStation=filteredTrains[i].timeTableRows[0]
    departureTime=firstStation.scheduledTime
    number=filteredTrains[i].trainNumber
    weight=departureTime.unix()-clockIs.unix()

    tobe={trainNumber: number, timeTo: weight, station: firstStation.stationShortCode}
    found=R.filter(R.propEq('station',firstStation.stationShortCode), neighbors)
    //console.log(found)
    if(found.length > 0) {
      if(found.timeTo > tobe.timeTo.unix) {
        neighbors=R.map(R.reject(R.propEq('trainNumber', found.trainNumber)))(neighbors)
        neighbors.push(tobe)
      }
    } else {
      console.log('lissää')
      neighbors.push(tobe)
    }
  }
  return neighbors
}

function getInitialMatrix(stationName) {
  nodes=dataUtils.connectedStations();
  //console.log(nodes)
  connectionMatrix=[]
  for (i=0; i < nodes.length; i++) {
    connectionsTo=[]
    for (j=0; j < nodes.length; j++) {
      station=nodes[j]
      if(nodes[j].stationShortCode != nodes[i].stationShortCode) {
        stationToBeSaved= {distance: Number.POSITIVE_INFINITY}
        connectionsTo.push({[station.stationShortCode]: stationToBeSaved});
      } else {
        stationToBeSaved= {distance: 0}
        connectionsTo.push({[station.stationShortCode]: stationToBeSaved});
      }
    }


    key=nodes[i].stationShortCode
    saveStation={stations: connectionsTo, current: false, name: key, visited: false}
    connectionMatrix.push(saveStation);

  }
  stat=R.find(R.propEq('name', stationName))(connectionMatrix)
  stat.current=true
  stat.visited=true
  return connectionMatrix;

}

module.exports = {
  run: runDijkstra
}
