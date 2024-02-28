import Rand from 'rand-seed';
import moment from "moment";
import { TerminalDataPoint } from '../../components/regionalpressure/regionalPressureSagas';

interface IStubService {
  generatePortPaxSeries: (start: string, end: string, interval: string, region: string, portCode: string[]) => TerminalDataPoint[]
}

class StubService implements IStubService {
  public generatePortPaxSeries(start: string, end: string, interval: string, region: string, portCodes: string[]) {
    const startDate = moment(start);
    const endDate = moment(end);
    const duration = moment.duration(endDate.diff(startDate));
    let durationInterval = 0;
    let randomRange = 0;
    switch (interval) {
      case 'days':
        durationInterval = duration.asDays();
        randomRange = 2000
        break;
      case 'weeks':
        durationInterval = duration.asWeeks();
        randomRange = 10000
        break;
      default:
        durationInterval = 24;
        randomRange = 300
        break;
    }
    console.log(interval);
    const results: TerminalDataPoint[] = []
    portCodes.forEach((portCode) => { 
      for (var index = 0; index < durationInterval; index++) {
        const intervalDate = moment(startDate).add(index, interval as moment.unitOfTime.DurationConstructor)
        const rand = new Rand(`${portCode}-${intervalDate.unix()}`);
        const EEAPax = Math.floor(randomRange * rand.next())
        const eGatePax = Math.floor(randomRange * rand.next())
        const nonEEApax = Math.floor(randomRange * rand.next())
        results.push({
          date: intervalDate.startOf('day').format('YYYY-MM-DD'),
          hour: index,
          portCode: portCode,
          queueCounts: [
            {
              queueName: "EEA",
              count: EEAPax
            },
            {
              queueName: "e-Gates",
              count: eGatePax
            },
            {
              queueName: "Non-EEA",
              count: nonEEApax
            }
          ],
          regionName: region,
          totalPcpPax: EEAPax + eGatePax + nonEEApax,
        })
      }
    })
    return results
  }
}

const _ss = new StubService()
export default _ss;
