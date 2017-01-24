var AI = require('./AI.js');

var actors = [
  {type: 'villain', name: 'Badmouth', location: 'HKI', caught: false, freeMinutes: 0, aifn: AI.villain },
  {type: 'villain', name: 'Mongoose', location: 'TPE', caught: false, freeMinutes: 0, aifn: AI.villain },
  {type: 'villain', name: 'Merauder', location: 'LPR', caught: false, freeMinutes: 0, aifn: AI.villain },
  {type: 'villain', name: 'Stiff Little Finger', location: 'KEM', caught: false, freeMinutes: 0, aifn: AI.villain },
  //{type: 'villain', name: 'Mr. a', location: 'KEM', caught: false, freeMinutes: 0, aifn: AI.noop }
];

module.exports = {
  actors: function() {
    return actors;
  },
  registerActor: function registerActor(type, name, location, aifn) {
    actors.push({freeMinutes: 0, caught: false, type: type, name: name, location: location, aifn: aifn});
  }
}
