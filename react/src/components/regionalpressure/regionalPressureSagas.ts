import {  call, put, takeEvery } from 'redux-saga/effects';
import {setRegionalDashboardState, setStatus } from './regionalPressureState';
import StubService from '../../services/stub-service';
import moment, { Moment } from 'moment';
import ApiClient from '../../services/ApiClient';
import axios from 'axios';
import { generateCsv, download } from "export-to-csv";

export type RequestPaxTotalsType = {
  type: "REQUEST_PAX_TOTALS",
  searchType: string,
  userPorts: string[],
  availablePorts: string[],
  startDate: string,
  endDate: string,
  isExport: boolean,
  comparison: string,
  comparisonStart: string,
  comparisonEnd: string,
};
export type PortTerminal = {
  port: string,
  ports: string[],
};

export type QueueCount = {
  queueName: string,
  count: number,
}

export type TerminalDataPoint = {
  date: string,
  hour: number,
  portCode: string,
  queueCounts: QueueCount[],
  regionName: string,
  totalPcpPax: number, 
  terminalName?: string,
};


export type ExportableDataPoint = {
  date: string,
  hour: number,
  portCode: string,
  regionName: string,
  totalPcpPax: number, 
  terminalName?: string,
  EEA?: number,
  nonEEA?:number,
  eGates?:number,
};

export type PortsObject = {
  [key:string] :  TerminalDataPoint[]
}

export type PortTotals = {
  [key:string] : number
}

type Response = {
  data: TerminalDataPoint[]
}

export const requestPaxTotals = (
  userPorts: string[], 
  availablePorts: string[], 
  searchType: string,
   startDate: string, 
   endDate: string, 
   isExport: boolean,
  comparison: string,
  comparisonStart: string,
  comparisonEnd: string,
)  :RequestPaxTotalsType => {
  return {
    "type": "REQUEST_PAX_TOTALS",
    searchType,
    userPorts,
    availablePorts,
    startDate,
    endDate,
    isExport,
    comparison,
    comparisonStart,
    comparisonEnd,
  };
};

export function getHistoricDateByDay(date: Moment) : Moment {
  return moment(date)
    .subtract(1, 'year')
    .isoWeek(date.isoWeek())
    .isoWeekday(date.isoWeekday())
}

const createExportableDatapoints = (datapoints: TerminalDataPoint[]) :ExportableDataPoint[] => {
  let flattenedCurrent: ExportableDataPoint[] = [];
  datapoints!.forEach((datapoint) => {
    flattenedCurrent.push({
      date: datapoint.date,
      hour: datapoint.hour,
      portCode: datapoint.portCode,
      regionName: datapoint.regionName,
      totalPcpPax: datapoint.totalPcpPax, 
      terminalName: datapoint.terminalName,
      EEA: datapoint.queueCounts[0]?.count || 0,
      eGates: datapoint.queueCounts[1]?.count || 0,
      nonEEA: datapoint.queueCounts[2]?.count || 0,
    })
  }); 
  return flattenedCurrent
}

export function* handleRequestPaxTotals(action: RequestPaxTotalsType) {
  try {
    yield(put(setStatus('loading')))
    const start = moment(action.startDate);
    const end = action.searchType === 'single' ? start : moment(action.endDate).endOf('day');
    let historicStart = getHistoricDateByDay(start).format('YYYY-MM-DD')
    let historicEnd = getHistoricDateByDay(end).format('YYYY-MM-DD')
    const duration = moment.duration(end.diff(start)).asHours();

    switch (action.comparison) {
      case 'previousYear':
        historicStart = getHistoricDateByDay(start).format('YYYY-MM-DD')
        historicEnd = getHistoricDateByDay(end).format('YYYY-MM-DD')
        break;
      case 'historicAverage':
        historicStart = moment(start).subtract(4, 'year').format('YYYY-MM-DD')
        historicEnd = moment(end).subtract(4, 'year').format('YYYY-MM-DD')
        break;
      case 'custom':
        historicStart = moment(action.comparisonStart).format('YYYY-MM-DD')
        historicEnd = moment(action.comparisonEnd).format('YYYY-MM-DD')
        break;
      default:
        historicStart = getHistoricDateByDay(start).format('YYYY-MM-DD')
        historicEnd = getHistoricDateByDay(end).format('YYYY-MM-DD')
        break;
    }
    
    const interval = duration >= 48 ? 'daily' : 'hourly';

    const fStart = start.format('YYYY-MM-DD');
    const fEnd = end.format('YYYY-MM-DD');

    let current: TerminalDataPoint[];
    let historic: TerminalDataPoint[];
    let currentResponse: Response;
    let historicResponse: Response;
    if (window.location.hostname.includes('localhost')) {
      //stub all data for local development
      current =  StubService.generatePortPaxSeries(fStart, fEnd, interval, 'region', action.availablePorts)
      historic = StubService.generatePortPaxSeries(historicStart, historicEnd, interval, 'region', action.availablePorts)
    } else {
      currentResponse = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${fStart}/${fEnd}?granularity=${interval}&port-codes=${action.availablePorts.join()}`);
      historicResponse = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${historicStart}/${historicEnd}?granularity=${interval}&port-codes=${action.availablePorts.join()}`);

      current = currentResponse.data;
      historic = historicResponse.data;

      if (action.availablePorts.includes('LHR')) {
        const LHRT2: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${fStart}/${fEnd}/T2?granularity=${interval}&port-codes=LHR`);
        const LHRT3: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${fStart}/${fEnd}/T3?granularity=${interval}&port-codes=LHR`);
        const LHRT4: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${fStart}/${fEnd}/T4?granularity=${interval}&port-codes=LHR`);
        const LHRT5: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${fStart}/${fEnd}/T5?granularity=${interval}&port-codes=LHR`);

        const LHRT2Historic: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${historicStart}/${historicEnd}/T2?granularity=${interval}&port-codes=LHR`);
        const LHRT3Historic: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${historicStart}/${historicEnd}/T3?granularity=${interval}&port-codes=LHR`);
        const LHRT4Historic: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${historicStart}/${historicEnd}/T4?granularity=${interval}&port-codes=LHR`);
        const LHRT5Historic: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${historicStart}/${historicEnd}/T5?granularity=${interval}&port-codes=LHR`);

        current = [...current, ...LHRT2.data, ...LHRT3.data, ...LHRT4.data, ...LHRT5.data ]
        historic = [...historic, ...LHRT2Historic.data, ...LHRT3Historic.data, ...LHRT4Historic.data, ...LHRT5Historic.data ]
      }
    }

    if (action.isExport) {


      const currentCSV = generateCsv({})(createExportableDatapoints(current));
      const historicCSV = generateCsv({})(createExportableDatapoints(historic));
      download({})(currentCSV);
      download({})(historicCSV);
      yield(put(setStatus('done')))
    } else {

      const portData: PortsObject = {};
      const portTotals: PortTotals = {};
      const historicPortData: PortsObject = {};
      const historicPortTotals: PortTotals = {};
  
      current!.forEach((datapoint) => {
        const portIndex = datapoint.terminalName ? `${datapoint.portCode}-${datapoint.terminalName}` : datapoint.portCode;
        datapoint.queueCounts!.forEach(passengerCount => {
          portTotals[portIndex] = (portTotals[portIndex] ? portTotals[portIndex] : 0) + passengerCount.count
        })
        portData[portIndex] ?
          portData[portIndex].push(datapoint)
            : portData[portIndex] = [datapoint]
      })
  
      historic!.forEach((datapoint) => {
        const portIndex = datapoint.terminalName ? `${datapoint.portCode}-${datapoint.terminalName}` : datapoint.portCode;
        datapoint.queueCounts!.forEach(passengerCount => {
          historicPortTotals[portIndex] = (historicPortTotals[portIndex] ? historicPortTotals[portIndex] : 0) + passengerCount.count
        })
        historicPortData[portIndex] ?
          historicPortData[portIndex].push(datapoint)
            : historicPortData[portIndex] = [datapoint]
      })
      
      yield(put(setRegionalDashboardState({
        portData,
        portTotals,
        historicPortData,
        historicPortTotals,
        type: action.searchType,
        start: fStart,
        end: fEnd,
        interval: duration >= 48 ? 'day' : 'hour',
        status: 'done'
      })))

    }

  } catch (e) {
    console.log(e)
  }
}

export function* requestPaxTotalsSaga() {
  yield takeEvery('REQUEST_PAX_TOTALS', handleRequestPaxTotals)
}
