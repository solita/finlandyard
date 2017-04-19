var AI = require('./AI.js');
var R = require('ramda');


var villainNames=['BadMouth','Mongoose','Luke','Annie', 'Lisa', 'Hannibal' , 'Darth']
var policeNames=['Police1','Police2','Police3','Police4', 'Police5', 'Police6' , 'Police7']
//var sensibleCities=['HKI', 'TKU', 'TPE', 'RI', 'HL', 'ROI', 'KKN', 'OL', 'KE']
var endStation=[]
var noPassengers=[]

var actors = [
  /*{type: 'villain', name: 'Badmouth', location: 'HKI', caught: false, freeMinutes: 0, aifn: AI.noop },
  {type: 'villain', name: 'Mongoose', location: 'TPE', caught: false, freeMinutes: 0, aifn: AI.noop },
  {type: 'villain', name: 'Luke', location: 'LR', caught: false, freeMinutes: 0, aifn: AI.noop },
  {type: 'villain', name: 'Annie', location: 'JY', caught: false, freeMinutes: 0, aifn: AI.noop },
  {type: 'villain', name: 'Lisa', location: 'OL', caught: false, freeMinutes: 0, aifn: AI.noop },
  {type: 'villain', name: 'Hannibal', location: 'HL', caught: false, freeMinutes: 0, aifn: AI.noop },
  {type: 'villain', name: 'Darth', location: 'KV', caught: false, freeMinutes: 0, aifn: AI.noop },*/
];

var registerActor=function(type, name, location, aifn) {
  actors.push({freeMinutes: 0, caught: false, type: type, name: name, location: location, aifn: aifn});
};

var addToStations=function(train) {
  if(endStation.indexOf(R.find(R.propEq('name', train), endStation)) < 0 && noPassengers.indexOf(R.find(R.propEq('stationShortCode', train), noPassengers)) < 0) {
    endStation.push({name: train, count: 1})
  } else if(endStation.indexOf(R.find(R.propEq('name', train), endStation)) >=0) {
    var foundInd=endStation.indexOf(R.find(R.propEq('name', train), endStation))
    endStation[foundInd].count=endStation[foundInd].count+1
  }


}

var isOverFive = train => train.count > 8;

var filterCities= function(trains) {
  var lenss = R.lensProp('timeTableRows')
  var filteredTrains=R.map(train => R.set(lenss, R.filter(R.propEq('type', 'ARRIVAL'),train.timeTableRows),train))(trains);
  filteredTrains=R.map(train => R.set(lenss, R.filter(R.propEq('trainStopping', true),train.timeTableRows),train))(filteredTrains);
  filteredTrains=R.filter(R.propEq('operatorShortCode', 'vr'),filteredTrains);
  filteredTrains=R.reject(R.propEq('trainCategory', 'Cargo'),filteredTrains);
  var filteredTimeTables=R.map(train => train.timeTableRows[train.timeTableRows.length-1], filteredTrains)
  var stationNames=R.map(train => train.stationShortCode, filteredTimeTables)

  R.forEach(addToStations, stationNames)
  endStation=R.filter(isOverFive, endStation)
  endStation=R.map(train => train.name, endStation)
  endStation.splice(endStation.indexOf("KOK"), 1);
  endStation.splice(endStation.indexOf("VNA"), 1);
}

var removeStationsNoPassengers=function(stations) {
  noPassengers=R.reject(R.propEq('passengerTraffic', true), stations)
}

module.exports = {
  actors: function() {
    return actors;
  },
  createVillains: function(amount, connections, stations, algo) {
    actors=[]
    if(endStation.length ==0) {
      removeStationsNoPassengers(stations);
      filterCities(connections)
    }
    if(amount > villainNames.length || amount < 1) {
      amount = villainNames.length
    }
    //stations=R.filter(R.propEq('passengerTraffic', true), stations)
    var selectedAI=AI.noop
    if(algo == 'rand') {
      selectedAI=AI.random
    }
    for(var i =0; i < amount; i++) {
      var selectedStation=Math.floor(Math.random()*endStation.length)
      registerActor('villain', villainNames[i], endStation[selectedStation] ,selectedAI);
    }
  },
  createPolices: function (amount, stations, algo) {
    if(amount > policeNames.length || amount < 1) {
      amount=policeNames.length
    }
    for(var i =0; i < amount; i++) {
      var selectedStation=Math.floor(Math.random()*endStation.length)
      if(algo == 'smart') {
        selectedAI=AI.dijkstra;

      } else if(algo=='rand'){
        selectedAI=AI.random;

      } else {
        console.log("Invalid search method " + algo + "! We choose random for you then")
        selectedAI=AI.random;

      }

      registerActor('police', policeNames[i], endStation[selectedStation] ,selectedAI);
    }

  }
}
