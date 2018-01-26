import R from 'ramda';
import dataUtils from './state/DataUtils.js';
import Actions from './engine/Actions.js';

const randomNth = (coll) =>  R.nth(Math.floor(Math.random() * coll.length), coll);

const randomAI = (clockIs, context, actor) => {

  const leavingTrains = dataUtils.trainsLeavingFrom(clockIs, actor.location);
  if(leavingTrains.length === 0) {
      return Actions.idle();
  }

  const train = randomNth(leavingTrains);
  if(R.isNil(train)) {
      return Actions.idle();
  }

  const chosenDestination = randomNth(dataUtils.getPossibleHoppingOffStations(train, actor.location));
  if(R.isNil(chosenDestination)) {
      return Actions.idle();
  }

  return Actions.train(train, chosenDestination);
}

const noopAI = () => Actions.idle();

const crime = () => Actions.crime();

const prettyStupidVillain = (clockIs, context, actor) => {

  if(R.contains(actor.location, context.policeDestinations)) {
    const train = dataUtils.nextLeavingTrain(clockIs, actor.location);

    if(!train) {
      return Actions.idle();
    }

    const possibleStops = dataUtils.getPossibleHoppingOffStations(train, actor.location);
    let hopOff = R.last(possibleStops);

    if(R.contains(hopOff,  context.policeDestinations) || R.contains(hopOff, context.knownPoliceLocations)) {
      hopOff = randomNth(R.reverse(possibleStops));
    }

    return Actions.train(train, hopOff);
  }

  return Actions.idle();
}

export default {
  random: randomAI,
  noop: noopAI,
  villain: prettyStupidVillain,
  crime
}
