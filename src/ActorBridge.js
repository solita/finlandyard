import AI from './AI.js'

const actors = [
      {type: 'villain', name: 'Badmouth', location: 'HKI', caught: false, freeMinutes: 0, aifn: AI.random },
      {type: 'villain', name: 'Mongoose', location: 'TPE', caught: false, freeMinutes: 0, aifn: AI.random },
      {type: 'villain', name: 'Luke', location: 'LR', caught: false, freeMinutes: 0, aifn: AI.random },
      {type: 'villain', name: 'Mehler', location: 'VS', caught: false, freeMinutes: 0, aifn: AI.random },
      {type: 'villain', name: 'Stiff Little Finger', location: 'TPE', caught: false, freeMinutes: 0, aifn: AI.random },
];

export default {
  actors() {
    return actors;
  },

  registerActor(type, name, location, aifn) {
    actors.push({freeMinutes: 0, caught: false, type: type, name: name, location: location, aifn: aifn});
  }
}
