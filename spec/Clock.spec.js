import {expect} from 'chai';
import Clock from '../src/Clock';

describe('Clock.js', () => {
  describe('tick()', () => {
    it('Should proceed one minute on tick', () => {
      const c = Clock(1, 1);
      expect(c.hour()).to.equal(1);
      expect(c.minutes()).to.equal(1);
      c.tick();
      expect(c.hour()).to.equal(1);
      expect(c.minutes()).to.equal(2);
    });

    it('Should overflow on minutes == 60', () => {
      const c = Clock(1, 59);
      c.tick();
      expect(c.hour()).to.equal(2);
      expect(c.minutes()).to.equal(0);
    });

    it('Should overflow on hour == 24', () => {
      const c = Clock(23, 59);
      c.tick();
      expect(c.hour()).to.equal(0);
      expect(c.minutes()).to.equal(0);
    });
  });

  describe('asString()', () => {
    it('Should pad 0 if needed', () => {
      const c = Clock(1, 1);
      expect(c.asString()).to.equal('01:01');

      const d = Clock(5, 12);
      expect(d.asString()).to.equal('05:12');

      const e = Clock(12, 4);
      expect(e.asString()).to.equal('12:04');
    });

    it('Should not pad 0 if not needed', () => {
      const c = Clock(11, 11);
      expect(c.asString()).to.equal('11:11');
    });
  });

  describe('isSame()', () => {
    it('Should return true for same tick', () => {
      const c = Clock(1, 1);
      expect(c.isSame(Clock(1, 2))).to.equal(false);
      c.tick();
      expect(c.isSame(Clock(1, 2))).to.equal(true);
      c.tick();
      expect(c.isSame(Clock(1, 2))).to.equal(false);
    });
  });

  describe('isBefore()', () => {
    it('should work correctly in simple cases', () => {
      expect(Clock(12, 0).isBefore(Clock(13, 0))).to.equal(true);
      expect(Clock(13, 0).isBefore(Clock(12, 0))).to.equal(false);
      expect(Clock(1, 0).isBefore(Clock(2, 0))).to.equal(true);
      expect(Clock(1, 0).isBefore(Clock(11, 0))).to.equal(true);
    });

    it('should consider minutes', () => {
      expect(Clock(12, 0).isBefore(Clock(12, 15))).to.equal(true);
      expect(Clock(13, 30).isBefore(Clock(13, 15))).to.equal(false);
      expect(Clock(1, 15).isBefore(Clock(1, 45))).to.equal(true);
    });

    it('should "overflow"', () => {
      expect(Clock(23, 0).isBefore(Clock(1, 0))).to.equal(true);
      expect(Clock(1, 0).isBefore(Clock(23, 0))).to.equal(false);
    });

    it('should handle cornercases correctly', () => {
      expect(Clock(12, 1).isBefore(Clock(23, 59))).to.equal(true);
      expect(Clock(12, 1).isBefore(Clock(0, 1))).to.equal(false);
      expect(Clock(23, 55).isBefore(Clock(0, 0))).to.equal(true);
      expect(Clock(0, 0).isBefore(Clock(23, 55))).to.equal(false);
      expect(Clock(1, 0).isBefore(Clock(1, 5))).to.equal(true);
      expect(Clock(12, 0).isBefore(Clock(12, 1))).to.equal(true);
    });
  });

  describe('clone()', () => {
    it('Should return new instance', () => {
      const ClockInstance = Clock(12, 1);
      const clone = ClockInstance.clone();
      expect(ClockInstance.minutes()).to.equal(clone.minutes());
      clone.tick();
      expect(ClockInstance.minutes()).not.to.equal(clone.minutes());
    })
  });
});
