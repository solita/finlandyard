var R = require('ramda');

var isObject = R.is(Object);

module.exports = {
  idle: function() {
    return {type: 'IDLE'}
  },
  train: function(train, stationShortCode) {
    var trainNumber = train;
    if(isObject(train)) {
      trainNumber = train.trainNumber;
    }
    return {type: 'TRAIN', trainNumber: trainNumber, destination: stationShortCode};
  },
  crime: function() {
    return {type: 'CRIME'};
  }
}
