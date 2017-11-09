var R = require('ramda');

module.exports = function(h, m) {
  var hour = h;
  var minutes = m;
  return {
    tick: function() {
      if(minutes == 59) {
        if(hour == 23) {
          hour = 0;
          minutes = 0;
        } else {
          minutes = 0;
          hour = hour + 1;
        }
      } else {
        minutes = minutes + 1;
      }
    },
    hour: function() {
      return hour;
    },
    minutes: function() {
      return minutes;
    },
    unix: function() {
      return hour * 60 + minutes;
    },
    asString: function() {
      var str = "";
      if(hour < 10) {
        str += "0";
      }
      str += hour + ":";

      if(minutes < 10) {
        str += "0";
      }
      str += minutes;
      return str;
    },
    isBefore: function(ref) {
      if(hour > 12 && ref.hour() < 12) {
          return true;
      }
      if(ref.hour() > 12 && hour < 12) {
        return false;
      }
      if(hour == ref.hour()) {
        return minutes <= ref.minutes();
      }
      return hour <= ref.hour();
    },
    isSame: function(ref) {
      return hour == ref.hour() && minutes == ref.minutes();
    }
  };
}
