'use strict';

describe("DataUtils", function() {

  var clock = require('../src/Clock.js');

  describe("clock arithmetics", function() {
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
