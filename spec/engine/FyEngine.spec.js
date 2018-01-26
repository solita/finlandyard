import {expect} from 'chai';
import R from 'ramda';
import FyEngine from '../../src/engine/FyEngine';
import Clock from '../../src/Clock';

describe('engine/FyEngine.js', () => {
  // Helpers for registering args sent to AI functions
  let callCount = 0;
  let receivedClockInstance = null;
  let receivedContext = null;

  const initAIFunctionCallRegistering = () => {
    callCount = 0;
    receivedClockInstance = null;
    receivedContext = null;

    return (clock, context) => {
      callCount++;
      receivedClockInstance = clock;
      receivedContext = context;

      // Returning R.identity is effectively the same as Actions.idle()
      return R.identity;
    }
  };

  const drawMock = {
    draw: R.identity
  };

  const stateChangeMock = {
    applyRound: R.identity
  };

  describe('runGameIteration()', () => {

    it('should proceed clock on every iteration', () => {
      const newState = FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [],
        clockIs: Clock(10, 1)
      });

      expect(newState.clockIs.hour()).to.equal(10);
      expect(newState.clockIs.minutes()).to.equal(2);

      FyEngine.runGameIteration(drawMock, stateChangeMock, newState);

      expect(newState.clockIs.hour()).to.equal(10);
      expect(newState.clockIs.minutes()).to.equal(3);
    });

    it('should call aifn() fn on actors', () => {

      const callRegisteringCallback = initAIFunctionCallRegistering();
      const newState = FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', aifn: callRegisteringCallback},
                 {name: 'duck-mockelson', aifn: callRegisteringCallback}],
        clockIs: Clock(10, 0)
      });

      // Two calls expected
      expect(callCount).to.equal(2);

      FyEngine.runGameIteration(drawMock, stateChangeMock, newState);

      // Total of four calls expected
      expect(callCount).to.equal(4);
    });

    it('should actually change states after calling ai-functions', () => {
      initAIFunctionCallRegistering();

      const newState = FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', aifn: () => R.merge({a: 1})}],
        clockIs: Clock(10, 0)});

      const yetAnotherState = FyEngine.runGameIteration(drawMock, stateChangeMock, newState);

      // Total of four calls expected
      expect(yetAnotherState.actors[0].a).to.equal(1);
    });

    it('should NOT call aifn() on caught actors', () => {
      const callRegisteringCallback = initAIFunctionCallRegistering();

      FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', caught: true, aifn: callRegisteringCallback}],
        clockIs: Clock(10, 0)
      });

      expect(callCount).to.equal(0);
    });

    it('should NOT call aifn() on actors on train', () => {
      const callRegisteringCallback = initAIFunctionCallRegistering();

      FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', train: {}, aifn: callRegisteringCallback}],
        clockIs: Clock(10, 0)});

      expect(callCount).to.equal(0);
    });

    it('should send clock correctly to the aifn (not the actual clock instance)', () => {
      const stateClockInstance = Clock(10, 0);
      const callRegisteringCallback = initAIFunctionCallRegistering();
      
      FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', aifn: callRegisteringCallback}],
        clockIs: stateClockInstance});

      expect(receivedClockInstance.hour()).to.equal(10);
      expect(receivedClockInstance.minutes()).to.equal(1);
    });

    it('should send context correctly for idling police', () => {
      const callRegisteringCallback = initAIFunctionCallRegistering();

      FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', type: 'police', location: 'HKI', aifn: callRegisteringCallback}],
        clockIs: Clock(10, 0)});

      expect(receivedContext.knownPoliceLocations).to.deep.equal(['HKI']);
      expect(receivedContext.knownPoliceDestinations).to.deep.equal([]);
    });

    it('should send context correctly for waiting police', () => {
      const callRegisteringCallback = initAIFunctionCallRegistering()

      FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', type: 'police', location: 'HKI', destination: 'TKU', aifn: callRegisteringCallback}],
        clockIs: Clock(10, 0)});

      expect(receivedContext.knownPoliceLocations).to.deep.equal(['HKI']);
      expect(receivedContext.knownPoliceDestinations).to.deep.equal(['TKU']);
    });

    it('should send context correctly for traveling police', () => {
      const callRegisteringCallback = initAIFunctionCallRegistering();

      FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', type: 'police', destination: 'TKU', aifn: callRegisteringCallback}],
        clockIs: Clock(10, 0)});

      expect(receivedContext.knownPoliceLocations).to.deep.equal([]);
      expect(receivedContext.knownPoliceDestinations).to.deep.equal(['TKU']);
    });

    it('should send context correctly for idling/criming villain', () => {
      const callRegisteringCallback = initAIFunctionCallRegistering();

      FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', type: 'villain', location: 'TKU', aifn: callRegisteringCallback}],
        clockIs: Clock(10, 0)});

      expect(receivedContext.knownVillainLocations).to.deep.equal(['TKU']);
    });

    it('should send context correctly for traveling villain', () => {
      const callRegisteringCallback = initAIFunctionCallRegistering();

      FyEngine.runGameIteration(drawMock, stateChangeMock, {
        stations: [],
        timetable: [],
        actors: [{name: 'mock-mockelson', type: 'villain', destination: 'TKU', aifn: callRegisteringCallback}],
        clockIs: Clock(10, 0)});

      expect(receivedContext.knownVillainLocations).to.deep.equal([]);
    });
  });
});
