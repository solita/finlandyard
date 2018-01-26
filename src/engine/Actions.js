/**
 Actions are functions for actors, which define single action.
 This module exposes functions which return another functions
 which are then evaluated by the engine.

 Warning: contains heavy ramda porn and closures
 */
import R from 'ramda'

const getTrainId = R.when(R.has('trainNumber'), R.prop('trainNumber'));

const incrementMoney = R.over(R.lensProp('money'), R.inc);

export default {
  idle() {
    return R.identity;
  },

  train(train, stationShortCode) {
    return R.compose(
      R.assoc('train', getTrainId(train)),
      R.assoc('destination', stationShortCode));
  },

  crime() {
    return incrementMoney;
  }
}