module.exports = {
  idle: function() {
    return {type: 'IDLE'}
  },
  train: function(trainNumber, stationShortCode) {
    return {type: 'TRAIN', trainNumber: trainNumber, destination: stationShortCode};
  }
}
