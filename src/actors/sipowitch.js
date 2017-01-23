var ActorBridge = require('../ActorBridge.js');
var dataUtils = require('../state/DataUtils.js');
var R = require('ramda');
var Actions = require('../Actions.js');

ActorBridge.registerActor('police', 'sipowitch', 'JNS', function(state, context, actor) {
  var leaving = dataUtils.trainsLeavingFrom(state, actor.location);
  var huntthis = R.find((train) => R.contains(R.head(context.knownVillainLocations), dataUtils.getPossibleHoppingOffStations(train, actor.location)), leaving);
  if(R.isNil(huntthis)) {
    return Actions.idle();
  }
  return Actions.train(huntthis.trainNumber, R.head(context.knownVillainLocations));
});
