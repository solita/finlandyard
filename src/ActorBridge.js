var AI = require('./AI.js');

var actors = [
  {type: 'villain', name: 'Mr. a', location: 'HKI', caught: false, freeMinutes: 0, aifn: AI.villain },
  {type: 'police', name: 'Mr. a', location: 'TPE', caught: false, freeMinutes: 0, aifn: AI.hunter },
  {type: 'police', name: 'Mr. a', location: 'TKU', caught: false, freeMinutes: 0, aifn: AI.hunter },
  {type: 'police', name: 'Mr. a', location: 'LPR', caught: false, freeMinutes: 0, aifn: AI.hunter },
  {type: 'police', name: 'Mr. a', location: 'KEM', caught: false, freeMinutes: 0, aifn: AI.hunter }
];

module.exports = {
  actors: function() {
    return actors;
  },
  registerActor: function registerActor(type, name, location, aifn) {
    actors.push({freeMinutes: 0, caught: false, type: type, name: name, location: location, aifn: aifn});
  }
}
