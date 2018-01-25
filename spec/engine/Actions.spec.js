import {expect} from 'chai';
import Actions from '../../src/engine/Actions';

describe('engine/Actions.js', function() {
  describe('idle()', function() {
    it('should return function which does nothing to actor', function() {
      const actor = {name: 'mock-mockelson', caught: false};
      const evaledActor = Actions.idle()(actor);
      expect(evaledActor).to.deep.equal(actor);
    });

  });

  describe('train()', function() {
    it('should return a function that assocs train to actor', function() {
      const actor = {name: 'mock-mockelson', caught: true};
      const evaledActor = Actions.train(123, "DEST")(actor);
      expect(evaledActor).to.deep.equal({name: 'mock-mockelson', caught: true, train: 123, destination: "DEST"});
    });

    it('should return a function that assocs train to actor when called with train object', function() {
      const actor = {name: 'mock-mockelson', caught: true};
      const evaledActor = Actions.train({trainNumber: 123}, "DEST")(actor);
      expect(evaledActor).to.deep.equal({name: 'mock-mockelson', caught: true, train: 123, destination: "DEST"});
    });
  });

  describe('crime()', function() {
    it('should inc actors money', function() {
      const actor = {name: 'mock-mockelson', caught: false, money: 0};
      const evaledActor = Actions.crime()(actor);
      expect(evaledActor).to.deep.equal({name: 'mock-mockelson', caught: false, money: 1});
    });
  });
});
