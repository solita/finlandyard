/**
 * Created by anniinasa on 13/04/17.
 */
var dataUtils = require('./state/DataUtils.js');
var R = require('ramda');

function addNeighbor(paths, neighbor, currShortest) {
  if(!(R.find((R.propEq('name', neighbor.name))))(currShortest)) {
    paths.push(currShortest.concat(neighbor))
  }
}

var runDijkstra = (clockIs,from, to) => {
  var nodes=dataUtils.connectedStations();
  if(!R.find(R.propEq('stationShortCode', from))(nodes)) {
    console.log('Ei löytynyt asemaa ' + from + '!')
    return;
  }
  if(!R.find(R.propEq('stationShortCode', to))(nodes)) {
    console.log('Ei löytynyt asemaa ' + to + '!')
    return;
  }
  var grid=getInitialMatrix(from);
  var paths=[]
  var startStation=R.find(R.propEq('current', true))(grid)
  startStation.arrivalTime = clockIs
  startStation.name=from
  startStation.timeTo=0

  paths.push([startStation])
  //console.log(grid)
  while(true) {
    var distances=R.map(path => path[path.length-1].timeTo)(paths)
    var shortIndex=distances.indexOf(Math.min(...distances));
    var currShortest=paths[shortIndex]
    paths.splice(shortIndex, 1) //FIX THIS to return removed node
    var currentNode=currShortest[currShortest.length-1]
    if(currentNode.name==to) {
      debugger;
      return currShortest;
    }
    console.log(currentNode.name)
    var neighbors=getNeighborsWithDistances(currentNode.arrivalTime, currentNode)
    neighbors=R.reject(train => (R.filter(R.propEq('name', train.name))(paths).length >0), neighbors)
    var lenss=R.lensProp('timeTo')
    neighbors=R.map(train => R.set(lenss, (train.timeTo+(train.arrivalTime.unix()-currShortest[0].arrivalTime.unix())), train))(neighbors)

    R.forEach(neighbor=>addNeighbor(paths, neighbor, currShortest))(neighbors)

  }

}

function getNeighborsWithDistances(clockIs, currentNode) {

  var trains=dataUtils.trainsLeavingFrom(clockIs, currentNode.name)

  var lenss = R.lensProp('timeTableRows')
  var filteredTrains=R.map(train => R.set(lenss, R.filter(R.propEq('type', 'ARRIVAL'),train.timeTableRows),train))(trains);
  filteredTrains=R.map(train => R.set(lenss, R.filter(R.propEq('trainStopping', true),train.timeTableRows),train))(filteredTrains);
  var neighbors=[]
  for(i=0; i < trains.length; i++) {
    var firstStation=filteredTrains[i].timeTableRows[0]
    var arrival=firstStation.scheduledTime
    var number=filteredTrains[i].trainNumber
    var weight=arrival.unix()-clockIs.unix()

    var tobe={trainNumber: number, arrivalTime: arrival, timeTo: weight, name: firstStation.stationShortCode}
    var found=R.filter(R.propEq('name',firstStation.stationShortCode), neighbors)
    if(found.length > 0) {
      if(found.timeTo > tobe.timeTo.unix) {
        neighbors=R.map(R.reject(R.propEq('trainNumber', found.trainNumber)))(neighbors)
        neighbors.push(tobe)
      }
    } else if(weight >= 0 && tobe.name != currentNode.name){
      neighbors.push(tobe)
    }
  }
  return neighbors
}

function getInitialMatrix(stationName) {
  var nodes=dataUtils.connectedStations();
  //console.log(nodes)
  var connectionMatrix=[]
  for (i=0; i < nodes.length; i++) {
    var connectionsTo=[]
    for (j=0; j < nodes.length; j++) {
      station=nodes[j]
      if(nodes[j].stationShortCode != nodes[i].stationShortCode) {
        var stationToBeSaved= {distance: Number.POSITIVE_INFINITY}
        connectionsTo.push({[station.stationShortCode]: stationToBeSaved});
      } else {
        stationToBeSaved= {distance: 0}
        connectionsTo.push({[station.stationShortCode]: stationToBeSaved});
      }
    }


    key=nodes[i].stationShortCode
    var saveStation={stations: connectionsTo, current: false, name: key, visited: false}
    connectionMatrix.push(saveStation);

  }
  var stat=R.find(R.propEq('name', stationName))(connectionMatrix)
  stat.current=true
  stat.visited=true
  return connectionMatrix;

}

module.exports = {
  run: runDijkstra
}
