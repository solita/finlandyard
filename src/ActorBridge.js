var AI = require('./AI.js');

var actors = [
  {type: 'villain', name: 'Mr. a', location: 'HKI', caught: false, freeMinutes: 0, aifn: AI.random },
  {type: 'villain', name: 'Mr. b', location: 'TKU', caught: false, freeMinutes: 0, aifn: AI.random },
  {type: 'villain', name: 'Mr. c', location: 'TPE', caught: false, freeMinutes: 0, aifn: AI.random },
  {type: 'villain', name: 'Mr. d', location: 'LPR', caught: false, freeMinutes: 0, aifn: AI.random },
  {type: 'villain', name: 'Mr. e', location: 'KEM', caught: false, freeMinutes: 0, aifn: AI.random }
];

module.exports = {
  actors: function() {
    return actors;
  },
  registerActor: function registerActor(type, name, location, aifn) {
    actors.push({type: type, name: name, location: location, aifn: aifn});
  }
}
