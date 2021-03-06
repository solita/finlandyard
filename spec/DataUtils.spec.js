import {expect} from 'chai';
import Clock from '../src/Clock';
import sb from './StateBuilder.spec.js';
import dataUtils from '../src/state/DataUtils.js';

describe('state/DataUtils.js', () => {
  describe('getStationById()', () => {
    it('should throw if no station was found for id', () => {
      const s = sb.state().build();
      dataUtils.initData(s);
      expect(() => { dataUtils.getStationById('STATIONID')}).to.throw(/No such station: STATIONID/);
    });

    it('should return station with id', () => {
      const s = sb.state().withStation(sb.station('STATIONID')).build();
      dataUtils.initData(s);
      expect(dataUtils.getStationById( 'STATIONID').stationShortCode).to.equal('STATIONID');
    });

    it('should return correct station with id', () => {
      const s = sb.state().withStation(sb.station('STATION-1')).withStation(sb.station('STATION-2')).build();
      dataUtils.initData(s);
      expect(dataUtils.getStationById('STATION-2').stationShortCode).to.equal('STATION-2');
    });
  });

  describe('collectConnections()', () => {
    it('Should collect connection between two stations', () => {
      const s = sb.state()
        .withStation(sb.station('ID-1', 14.24444, 42.24242))
        .withStation(sb.station('ID-2', 43.42424, 13.2424))
        .withTimetableEntry('TRAIN-1',
            sb.departure('ID-1'),
            sb.arrival('ID-2'))
        .build();

      dataUtils.initData(s);

      expect(dataUtils.collectConnections())
        .to.deep.equal([{from: [14.24444, 42.24242], to: [43.42424, 13.2424]}]);
    });

    it('Should collect transitive connections between stations', () => {
      const s = sb.state()
        .withStation(sb.station('ID-1', 14.24444, 42.24242))
        .withStation(sb.station('ID-2', 43.42424, 13.2424))
        .withStation(sb.station('ID-3', 46.42424, 34.2424))
        .withTimetableEntry('TRAIN-1',
            sb.departure('ID-1'),
            sb.arrival('ID-2'),
            sb.departure('ID-2'),
            sb.arrival('ID-3'))
        .build();

      dataUtils.initData(s);

      expect(dataUtils.collectConnections())
        .to.deep.equal([{from: [14.24444, 42.24242], to: [43.42424, 13.2424]}, {from: [43.42424, 13.2424], to: [46.42424, 34.2424]}]);
    });

    it('Should pick connection only once for different routes', () => {
      const s = sb.state()
        .withStation(sb.station('ID-1', 14.24444, 42.24242))
        .withStation(sb.station('ID-2', 43.42424, 13.2424))
        .withTimetableEntry('TRAIN-1',
            sb.departure('ID-1'),
            sb.arrival('ID-2'))
        .withTimetableEntry('TRAIN-2',
            sb.departure('ID-1'),
            sb.arrival('ID-2'))
        .build();

      dataUtils.initData(s);

      expect(dataUtils.collectConnections().length).to.equal(1);
    });

    it('Should pick connection only once for opposite routes', () => {
      const s = sb.state()
        .withStation(sb.station('ID-1', 14.24444, 42.24242))
        .withStation(sb.station('ID-2', 43.42424, 13.2424))
        .withTimetableEntry('TRAIN-1',
            sb.departure('ID-1'),
            sb.arrival('ID-2'))
        .withTimetableEntry('TRAIN-2',
            sb.departure('ID-2'),
            sb.arrival('ID-1'))
        .build();

      dataUtils.initData(s);

      expect(dataUtils.collectConnections().length).to.equal(1);
    });
  });

  describe('connectedStations()', () => {
    it('Should return nothing without timetable', () => {
      const s = sb.state()
        .withStation(sb.station('ID-1', 14.24444, 42.24242))
        .build();

      dataUtils.initData(s);

      expect(dataUtils.connectedStations().length).to.equal(0);
    });

    it('Should return stations in timetable', () => {
      const s = sb.state()
        .withStation(sb.station('ID-1', 14.24444, 42.24242))
        .withStation(sb.station('ID-2', 62.24444, 41.24242))
        .withStation(sb.station('ID-3', 32.24444, 45.24242))
        .withTimetableEntry('TRAIN-1',
            sb.departure('ID-1'),
            sb.arrival('ID-2'))
        .build();

      dataUtils.initData(s);

      expect(dataUtils.connectedStations().length).to.equal(2);
    });
  });

  describe('trainsLeavingFrom()', () => {
    it('Should find leaving trains when one is leaving and Clock is before departure', () => {
      const s = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', Clock(5, 10)),
          sb.arrival('STATION-2', Clock(5, 17)))
        .build();

      dataUtils.initData(s);

      const ClockIs = Clock(4, 10);

      expect(dataUtils.trainsLeavingFrom(ClockIs, 'STATION-1').length).to.equal(1);
    });

    it('Should not find already left trains', () => {
      const s = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', Clock(5, 10)),
          sb.arrival('STATION-2', Clock(5, 16)))
        .build();

      dataUtils.initData(s);

      const ClockIs = Clock(7, 10);

      expect(dataUtils.trainsLeavingFrom(ClockIs, 'STATION-1').length).to.equal(0);
    });

    it('Should find trains actor can jump into', () => {
      const s = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', Clock(5, 10)),
          sb.arrival('STATION-2', Clock(6, 16)),
          sb.departure('STATION-2', Clock(6, 19),
          sb.arrival('STATION-3', Clock(8, 16))))
        .build();

      dataUtils.initData(s);

      const ClockIs = Clock(5, 10);

      expect(dataUtils.trainsLeavingFrom(ClockIs, 'STATION-2').length).to.equal(1);
    });
  });

  describe('howCanIGetTo() EXPERIMENTAL', () => {
    it('Should find without transition', () => {
      const s = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', Clock(5, 10)),
          sb.arrival('STATION-2', Clock(6, 16)))
        .build();

      dataUtils.initData(s);

      expect(dataUtils.howCanIGetTo('STATION-1', 'STATION-2')).to.equal('FROMHERE');
    });

    it('Should find one transition', () => {
      const s = sb.state()
        .withStation(sb.station('STATION-1', 14.24444, 42.24242))
        .withStation(sb.station('STATION-2', 62.24444, 41.24242))
        .withStation(sb.station('STATION-3', 61.24444, 21.24242))
        .withTimetableEntry('TRAIN-1',
          sb.departure('STATION-1', Clock(5, 10)),
          sb.arrival('STATION-2', Clock(6, 16)))
        .withTimetableEntry('TRAIN-2',
          sb.departure('STATION-2', Clock(6, 20)),
          sb.arrival('STATION-3', Clock(7, 16)))
        .build();

      dataUtils.initData(s);

      expect(dataUtils.howCanIGetTo('STATION-1', 'STATION-3')[0]).to.equal('STATION-2');
    });
  });
});