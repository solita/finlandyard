'use strict';

describe("DataUtils", function() {

  var clock = require('../src/Clock.js');

  describe('tick', function() {
    it('Should proceed one minute on tick', function() {
      var c = clock(1, 1);
      expect(c.hour()).toBe(1);
      expect(c.minutes()).toBe(1);
      c.tick();
      expect(c.hour()).toBe(1);
      expect(c.minutes()).toBe(2);
    });
    it('Should overflow on minutes == 60', function() {
      var c = clock(1, 59);
      c.tick();
      expect(c.hour()).toBe(2);
      expect(c.minutes()).toBe(0);
    });
    it('Should overflow on hour == 24', function() {
      var c = clock(23, 59);
      c.tick();
      expect(c.hour()).toBe(0);
      expect(c.minutes()).toBe(0);
    });
  });

  describe('asString', function() {
    it('Should pad 0 if needed', function() {
      var c = clock(1, 1);
      expect(c.asString()).toBe("01:01");

      var d = clock(5, 12);
      expect(d.asString()).toBe("05:12");

      var e = clock(12, 4);
      expect(e.asString()).toBe("12:04");
    });
    it('Should not pad 0 if not needed', function() {
      var c = clock(11, 11);
      expect(c.asString()).toBe("11:11");
    });
  });

  describe('isSame', function() {
    it('Should return true for same tick', function() {
      var c = clock(1, 1);
      expect(c.isSame(clock(1, 2))).toBe(false);
      c.tick();
      expect(c.isSame(clock(1, 2))).toBe(true);
      c.tick();
      expect(c.isSame(clock(1, 2))).toBe(false);
    });
  });

  describe("isBefore", function() {
    it("should work correctly in simple cases", function() {
      expect(clock(12, 0).isBefore(clock(13, 0))).toBe(true);
      expect(clock(13, 0).isBefore(clock(12, 0))).toBe(false);
      expect(clock(1, 0).isBefore(clock(2, 0))).toBe(true);
      expect(clock(1, 0).isBefore(clock(11, 0))).toBe(true);
    });
    it("should consider minutes", function() {
      expect(clock(12, 0).isBefore(clock(12, 15))).toBe(true);
      expect(clock(13, 30).isBefore(clock(13, 15))).toBe(false);
      expect(clock(1, 15).isBefore(clock(1, 45))).toBe(true);
    });
    it("should 'overflow'", function() {
      expect(clock(23, 0).isBefore(clock(1, 0))).toBe(true);
      expect(clock(1, 0).isBefore(clock(23, 0))).toBe(false);
    });
    it("cornercases", function() {
      expect(clock(12, 1).isBefore(clock(23, 59))).toBe(true);
      expect(clock(12, 1).isBefore(clock(0, 1))).toBe(false);
      expect(clock(23, 55).isBefore(clock(0, 0))).toBe(true);
      expect(clock(0, 0).isBefore(clock(23, 55))).toBe(false);
      expect(clock(1, 0).isBefore(clock(1, 5))).toBe(true);
      expect(clock(12, 0).isBefore(clock(12, 1))).toBe(true);
    });
  });
});
