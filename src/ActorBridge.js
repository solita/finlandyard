var AI = require('./AI.js');

var villainNames=['BadMouth','Mongoose','Luke','Annie', 'Lisa', 'Hannibal' , 'Darth']
var policeNames=['Police1','Police2','Police3','Police4', 'Police5', 'Police6' , 'Police7']

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

module.exports = {
  actors: function() {
    return actors;
  },
  createVillains: function(amount, stations) {
    actors=[]
    if(amount > villainNames.length || amount < 1) {
      amount = villainNames.length
    }
    for(var i =0; i < amount; i++) {
      var selectedStation=Math.floor(Math.random()*stations.length)
      registerActor('villain', villainNames[i], stations[selectedStation].stationShortCode ,AI.random);
    }
  },
  createPolices: function (amount, stations) {
    if(amount > policeNames.length || amount < 1) {
      amount=policeNames.length
    }
    for(var i =0; i < amount; i++) {
      var selectedStation=Math.floor(Math.random()*stations.length)
      registerActor('police', policeNames[i], stations[selectedStation].stationShortCode ,AI.random);
    }

  }
}
