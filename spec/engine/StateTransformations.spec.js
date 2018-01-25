import {expect} from 'chai';
import sb from '../StateBuilder.spec.js';
import moment from 'moment';
import stateUtils from '../../src/engine/StateTransformations.js';
import dataUtils from '../../src/state/DataUtils.js';

describe('engine/StateTransformations.js', () => {
  describe('applyStateChanges()', () => {
    it('should not mark villain caught if there are no police in same location', () => {
      const state = {
        actors: [
          {type: 'villain', name: 'x', caught: false, location: 'HKI'},
          {type: 'police', name: 'y', caught: false, location: 'PSL'}
        ]
      };

      const newState = stateUtils.applyStateChanges(state);

      expect(newState.actors[0].caught).to.be.false;
      expect(newState.actors[1].caught).to.be.false;
    });

    it('Should mark villain caught if in same location than police', () => {
      const state = {
        actors: [
          {type: 'villain', name: 'x', caught: false, location: 'HKI'},
          {type: 'police', name: 'y', caught: false, location: 'HKI'}
        ]
      };

      const newState = stateUtils.applyStateChanges(state);

      expect(newState.actors[0].caught).to.be.true;
      expect(newState.actors[1].caught).to.be.false;
    });

    it('Should not mark villain caught if in in train without police', () => {
      const state = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .withTimetableEntry('TRAIN-2',
          sb.departure('STATION-2', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-1', moment({hour: 6, minute: 16})))
        .build();

      dataUtils.initData(state);

      state.actors = [
          {type: 'villain', name: 'x', caught: false, train: 'TRAIN-1', destination: 'STATION-2', location: null},
          {type: 'police', name: 'y', caught: false, train: 'TRAIN-2',  destination: 'STATION-1', location: null}];

      state.clockIs = moment({hour: 5, minute: 9});

      const newState = stateUtils.applyStateChanges(state);

      expect(newState.actors[0].caught).to.be.false;
      expect(newState.actors[1].caught).to.be.false;
    });

    it('Should mark villain caught if in same train than police', () => {
      const state = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .withTimetableEntry('TRAIN-2',
          sb.departure('STATION-2', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-1', moment({hour: 6, minute: 16})))
        .build();

      state.actors = [
          {type: 'villain', name: 'x', caught: false, train: 'TRAIN-1', destination: 'STATION-2', location: null},
          {type: 'police', name: 'y', caught: false, train: 'TRAIN-1',  destination: 'STATION-2', location: null}];

      state.clockIs = moment({hour: 5, minute: 9});

      const newState = stateUtils.applyStateChanges(state);

      expect(newState.actors[0].caught).to.be.true;
      expect(newState.actors[1].caught).to.be.false;
    });

    it('Should work correctly with multiple actors caughting', () => {
      const state = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .withTimetableEntry('TRAIN-2',
          sb.departure('STATION-2', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-1', moment({hour: 6, minute: 16})))
        .build();

      state.actors = [
        {type: 'villain', name: 'a', caught: false, train: 'TRAIN-1', destination: 'STATION-2', location: null},
        {type: 'police', name: 'b', caught: false, train: 'TRAIN-1', destination: 'STATION-2', location: null},
        {type: 'villain', name: 'c', caught: false, train: 'TRAIN-2',  destination: 'STATION-1',location: null},
        {type: 'police', name: 'd', caught: false, train: null, location: 'HKI'},
        {type: 'villain', name: 'e', caught: false, train: null, location: 'TMP'},
        {type: 'police', name: 'f', caught: false, train: null, location: 'HKI'},
        {type: 'villain', name: 'g', caught: false, train: null, location: 'RVM'},
        {type: 'police', name: 'h', caught: false, train: null, location: 'PSL'},
        {type: 'villain', name: 'i', caught: false, train: null, location: 'RVM'},
        {type: 'police', name: 'j', caught: false, train: null, location: 'TMP'},
      ];

      state.clockIs = moment({hour: 5, minute: 9});

      const newState = stateUtils.applyStateChanges(state);
      expect(newState.actors[0].caught).to.be.true; // Police in same train
      expect(newState.actors[1].caught).to.be.false; // police
      expect(newState.actors[2].caught).to.be.false; // no police in train
      expect(newState.actors[3].caught).to.be.false; // police
      expect(newState.actors[4].caught).to.be.true; // Police in same city
      expect(newState.actors[5].caught).to.be.false; // Police
      expect(newState.actors[6].caught).to.be.false; // another villain in same city
      expect(newState.actors[7].caught).to.be.false; // Police
      expect(newState.actors[8].caught).to.be.false; // another villain in same city
      expect(newState.actors[9].caught).to.be.false; // Police
    });
  });

  describe('calculateNewPositions()', () => {
    it('should not alter actor if trains has not left yet', () => {
      const s = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', moment({hour: 5, minute: 10})),
          sb.arrival('STATION-2', moment({hour: 6, minute: 16})))
        .build();

      s.actors = [{name: 'Dummy', location: 'STATION-1', train: 'TRAIN-1', destination: 'STATION-2'}];
    });
  });
});
