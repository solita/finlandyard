import AI from './AI.js'

// Propert isPlayer: true, marks the player bot
const actors = [
  {type: 'villain', name: 'Badmouth', location: 'OL', caught: false, freeMinutes: 0,money: 0, aifn: AI.crime, isPlayer: false},
  {type: 'villain', name: 'Mongoose', location: 'TPE', caught: false, freeMinutes: 0,money: 0, aifn: AI.crime, isPlayer: false },
  {type: 'villain', name: 'Luke', location: 'LR', caught: false, freeMinutes: 0,money: 0, aifn: AI.random, isPlayer: false },
  {type: 'villain', name: 'Mehler', location: 'VS', caught: false, freeMinutes: 0,money: 0, aifn: AI.random, isPlayer: false },
  {type: 'villain', name: 'Stiff Little Finger', location: 'TPE', caught: false, freeMinutes: 0,money: 0, aifn: AI.random, isPlayer: false },
];

export default {
  actors() {
    return actors;
  },

  registerActor(type, name, location, aifn) {
    actors.push({freeMinutes: 0, caught: false, type: type, name: name, money: 0, location: location, aifn: aifn});
  },

  registerPlayer(name, location, aifn) {
    actors.push({freeMinutes: 0, caught: false, type: 'villain', name: name, money: 0, location: location, aifn: aifn, isPlayer:true});
  }
}
