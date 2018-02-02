/**
 * Created by anniinasa on 21/12/17.
 */
import R from 'ramda'
import Actions from '../engine/Actions.js'
import ActorBridge from '../ActorBridge.js'
import dataUtils from '../state/DataUtils.js'
import {log} from '../utils/Log';


//This is template for villain

ActorBridge.registerActor('villain', 'Joonatan', 'KEM', function (clockIs, context, actor) {
  if (!actor.isPlayer) {
    actor.isPlayer = true;
  }
  return Actions.crime();

});