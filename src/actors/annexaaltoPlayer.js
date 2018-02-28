import R from 'ramda'
import Actions from '../engine/Actions.js'
import ActorBridge from '../ActorBridge.js'
import dataUtils from '../state/DataUtils.js'
import {log} from '../utils/Log';

// This might be handy at some point?
// randomNth([1, 2, 3, 4, 5]) -> 4 (not pure! Different value each time)
const randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

// To get started:
// -- Maybe you should check if police is arriving at your location?
// -- If not, do crime, else take a train and run away!!!!!

// How to take a train?
// Getting the next train leaving from your stationName
// dataUtils.nextLeavingTrain(clockIs, actor.location);
// Returns train object which you can pass to Actions.train(train, 'HKI')
// The last argument is the station you hop of from train (PROTIP: you should select it from the train object)
// train object contains array of timeTableRows, from which you can select the hopping of station (the stationShortCode field)

// Getting the possible hopping of stations for train
// dataUtils.getPossibleHoppingOffStations(train, actor.location);

/**
 * Here is your player, CODE HARD!
 *
 * First, make up a GREAT name for your player and add it ass a first arg.
 *
 * return Actions.idle() <- idle, don't do nothing (you don't get points...)
 * return Actions.crime() <- do crime and get one (1) point
 * return Actions.train(train, hopOfStation) <- take the train and hop of at hopOfStation
 */
ActorBridge.registerPlayer('!!!IMPORTANT_PLAYER_NAME_HERE!!!!', 'HKI', function(clockIs, context, actor) {
  log(context);

  /* context is an object such:

  {
    "knownVillainLocations": [
      "OL",
      "HKI"
    ],
    "knownPoliceLocations": [
      "TKU"
    ],
    "knownPoliceDestinations": []
  }
  */

  //throw Error('Short circuit at any time by throwing! Remove this.');
  return Actions.idle();
});
