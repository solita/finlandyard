import _ from 'lodash'
import Clock from '../src/Clock'

const station = (id, longitude, latitude) => ({
  stationShortCode: id,
  name: 'Station ' + id,
  latitude: latitude || 63.32323,
  longitude: longitude || 42.424242
})

const departure = (stationId, scheduledTime) => ({
  stationShortCode: stationId,
  type: 'DEPARTURE',
  trainStopping: true,
  scheduledTime: scheduledTime || Clock(1, 1)
})

const arrival = (stationId, scheduledTime) => ({
  stationShortCode: stationId,
  type: 'ARRIVAL',
  trainStopping: true,
  scheduledTime: scheduledTime || Clock(1, 1)
})

const state = () => {
  const stuff = {
    stations: [],
    timetable: []
  };

  return {
    withStation: function(newStation) {
      stuff.stations = _.concat(stuff.stations, newStation);
      return this;
    },

    withTimetableEntry:function(id) {
      stuff.timetable = _.concat(stuff.timetable, {
        trainNumber: id,
        timeTableRows: Array.prototype.slice.call(arguments).slice(1)
      });
      return this;
    },

    build: function() {
      return stuff;
    }
  };
}

export default {
  state,
  arrival,
  departure,
  station
}