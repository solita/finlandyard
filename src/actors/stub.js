var ActorBridge = require('../ActorBridge.js');
var dataUtils = require('../state/DataUtils.js');
var R = require('ramda');
var Actions = require('../Actions.js');



ActorBridge.registerActor('police', 'stub', 'JNS', function(clockIs, context, actor) {
  return Actions.idle();
});
