import R from 'ramda'
import Actions from '../engine/Actions.js'
import ActorBridge from '../ActorBridge.js'
import dataUtils from '../state/DataUtils.js'
import {log} from '../utils/Log';

// This might be handy at some point?
// randomNth([1, 2, 3, 4, 5]) -> 4 (not pure! Different value each time)
const randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

// PROTIP: Maybe you should check if police is arriving at your location?
// If not, do crime, else take a train and run away!!!!!

// Getting the next train leaving from your stationName
// dataUtils.nextLeavingTrain(clockIs, actor.location);
// Returns train object which you can pass to Actions.train(train, 'HKI')

// Getting the possible hopping of stations for train
// dataUtils.getPossibleHoppingOffStations(train, actor.location);

/**
 * Here is your player, CODE HARD!
 *
 * First, make up a GREAT name for your player and add it ass a first arg.
 *
 * return Action.idle() <- idle, don't do nothing (you don't get points...)
 * return Action.crime() <- do crime and get one (1) point
 * return Action.train(train, hopOfStation) <- take the train and hop of at hopOfStation
 */
ActorBridge.registerPlayer('!!!IMPORTANT_PLAYER_NAME_HERE!!!!', 'HKI', function(clockIs, context, actor) {
  log(context);
  throw Error('Short circuit for seeing context!');
  return Actions.idle();
});
