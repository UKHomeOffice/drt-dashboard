import {  call, put, takeEvery } from 'redux-saga/effects';
import {setRegionalDashboardState } from './regionalPressureState';
import StubService from '../../services/stub-service';
import moment from 'moment';
import ApiClient from '../../services/ApiClient';
import axios from 'axios';

export type RequestPaxTotalsType = {
  type: "REQUEST_PAX_TOTALS",
  searchType: string,
  ports: string[],
  startDate: string,
  endDate: string,
};
export type PortTerminal = {
  port: string,
  ports: string[],
};

export const requestPaxTotals = (ports: string[], searchType: string, startDate: string, endDate: string) :RequestPaxTotalsType => {
  return {
    "type": "REQUEST_PAX_TOTALS",
    searchType,
    ports,
    startDate,
    endDate
  };
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

function* handleRequestPaxTotals(action: RequestPaxTotalsType) {
  try {
    const start = moment(action.startDate).startOf('day').format('YYYY-MM-DD');
    const end = action.searchType === 'single' ? start : moment(action.endDate).startOf('day').format('YYYY-MM-DD');
    const historicStart = moment(start).subtract(1, 'year').format('YYYY-MM-DD')
    const historicEnd = moment(end).subtract(1, 'year').format('YYYY-MM-DD')
    const interval = action.searchType === 'single' ? 'hourly' : 'daily';

    let current: TerminalDataPoint[];
    let historic: TerminalDataPoint[];
    if (window.location.hostname.includes('localhost')) {
      current =  StubService.generatePortPaxSeries(start, end, interval, 'region', action.ports)
      historic = StubService.generatePortPaxSeries(historicStart, historicEnd, interval, 'region', action.ports)
    } else {
      const currentResponse: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${start}/${end}?granularity=${interval}&port-codes=${action.ports.join()}`);
      const historicResponse: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${historicStart}/${historicEnd}?granularity=${interval}&port-codes=${action.ports.join()}`);
      current = currentResponse.data;
      historic = historicResponse.data;
    }

    const portData: PortsObject = {};
    const portTotals: PortTotals = {};
    const historicPortData: PortsObject = {};
    const historicPortTotals: PortTotals = {};

    current!.forEach((datapoint) => {
      datapoint.queueCounts.forEach(passengerCount => {
        portTotals[datapoint.portCode] = (portTotals[datapoint.portCode] ? portTotals[datapoint.portCode] : 0) + passengerCount.count
      })
      portData[datapoint.portCode] ?
      portData[datapoint.portCode].push(datapoint)
        : portData[datapoint.portCode] = [datapoint]
    })

    historic!.forEach((datapoint) => {
      datapoint.queueCounts.forEach(passengerCount => {
        historicPortTotals[datapoint.portCode] = (historicPortTotals[datapoint.portCode] ? historicPortTotals[datapoint.portCode] : 0) + passengerCount.count
      })
      historicPortData[datapoint.portCode] ?
      historicPortData[datapoint.portCode].push(datapoint)
        : historicPortData[datapoint.portCode] = [datapoint]
    })
    yield(put(setRegionalDashboardState({
      portData,
      portTotals,
      historicPortData,
      historicPortTotals,
      type: action.searchType,
      start,
      end,
      interval: action.searchType === 'single' ? 'hour' : 'day'
    })))

  } catch (e) {
    console.log(e)
  }
}

export function* requestPaxTotalsSaga() {
  yield takeEvery('REQUEST_PAX_TOTALS', handleRequestPaxTotals)
}
