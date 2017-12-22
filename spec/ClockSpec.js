'use strict';

const expect = require('chai').expect

describe('clock.js', function() {

  var clock = require('../src/Clock.js');

  describe('tick()', function() {
    it('Should proceed one minute on tick', function() {
      var c = clock(1, 1);
      expect(c.hour()).to.equal(1);
      expect(c.minutes()).to.equal(1);
      c.tick();
      expect(c.hour()).to.equal(1);
      expect(c.minutes()).to.equal(2);
    });
    it('Should overflow on minutes == 60', function() {
      var c = clock(1, 59);
      c.tick();
      expect(c.hour()).to.equal(2);
      expect(c.minutes()).to.equal(0);
    });
    it('Should overflow on hour == 24', function() {
      var c = clock(23, 59);
      c.tick();
      expect(c.hour()).to.equal(0);
      expect(c.minutes()).to.equal(0);
    });
  });

  describe('asString()', function() {
    it('Should pad 0 if needed', function() {
      var c = clock(1, 1);
      expect(c.asString()).to.equal("01:01");

      var d = clock(5, 12);
      expect(d.asString()).to.equal("05:12");

      var e = clock(12, 4);
      expect(e.asString()).to.equal("12:04");
    });
    it('Should not pad 0 if not needed', function() {
      var c = clock(11, 11);
      expect(c.asString()).to.equal("11:11");
    });
  });

  describe('isSame()', function() {
    it('Should return true for same tick', function() {
      var c = clock(1, 1);
      expect(c.isSame(clock(1, 2))).to.equal(false);
      c.tick();
      expect(c.isSame(clock(1, 2))).to.equal(true);
      c.tick();
      expect(c.isSame(clock(1, 2))).to.equal(false);
    });
  });

  describe("isBefore()", function() {
    it("should work correctly in simple cases", function() {
      expect(clock(12, 0).isBefore(clock(13, 0))).to.equal(true);
      expect(clock(13, 0).isBefore(clock(12, 0))).to.equal(false);
      expect(clock(1, 0).isBefore(clock(2, 0))).to.equal(true);
      expect(clock(1, 0).isBefore(clock(11, 0))).to.equal(true);
    });
    it("should consider minutes", function() {
      expect(clock(12, 0).isBefore(clock(12, 15))).to.equal(true);
      expect(clock(13, 30).isBefore(clock(13, 15))).to.equal(false);
      expect(clock(1, 15).isBefore(clock(1, 45))).to.equal(true);
    });
    it("should 'overflow'", function() {
      expect(clock(23, 0).isBefore(clock(1, 0))).to.equal(true);
      expect(clock(1, 0).isBefore(clock(23, 0))).to.equal(false);
    });
    it("should handle cornercases correctly", function() {
      expect(clock(12, 1).isBefore(clock(23, 59))).to.equal(true);
      expect(clock(12, 1).isBefore(clock(0, 1))).to.equal(false);
      expect(clock(23, 55).isBefore(clock(0, 0))).to.equal(true);
      expect(clock(0, 0).isBefore(clock(23, 55))).to.equal(false);
      expect(clock(1, 0).isBefore(clock(1, 5))).to.equal(true);
      expect(clock(12, 0).isBefore(clock(12, 1))).to.equal(true);
    });
  });
});
