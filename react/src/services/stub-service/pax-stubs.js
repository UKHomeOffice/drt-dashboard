import moment from "moment";
import Rand from 'rand-seed';

export const paxStubs = {
  generatePortPaxSeries: (start, end, interval, region) => {
    const startDate = moment(start);
    const endDate = moment(end);
    const duration = moment.duration(startDate.diff(endDate));
    let durationInterval = 0;
    switch (interval) {
      case 'days':
        durationInterval = duration.asDays();
        break;
      case 'weeks':
        durationInterval = duration.asWeeks();
        break;
      default:
        durationInterval = duration.asHours();
        break;
    }
    return Array(interval).map((index) => {
      const intervalDate = moment(startDate).add(index, interval)
      const rand = new Rand(intervalDate.unix());
      const EEAPax = 1000 * rand.next()
      const eGatePax = 1000 * rand.next()
      const nonEEApax = 1000 * rand.next()
      return {
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
      }
    })
  }
}
