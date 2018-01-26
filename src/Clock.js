const clock = (h, m) => {
  let hour = h;
  let minutes = m;

  return {
    clone() {
      return clock(hour, minutes);
    },

    tick() {
      if(minutes === 59) {
        if(hour === 23) {
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

    hour() {
      return hour;
    },

    minutes() {
      return minutes;
    },

    unix() {
      return hour * 60 + minutes;
    },

    asString() {
      return `${(hour < 10 ? '0' : '') + hour}:${(minutes < 10 ? '0' : '') + minutes}`
    },

    isBefore(ref) {
      if(hour > 12 && ref.hour() < 12) {
          return true;
      }

      if(ref.hour() > 12 && hour < 12) {
        return false;
      }

      if(hour === ref.hour()) {
        return minutes <= ref.minutes();
      }

      return hour <= ref.hour();
    },

    isSame(ref) {
      return hour === ref.hour() && minutes === ref.minutes();
    }
  };
}

export default clock