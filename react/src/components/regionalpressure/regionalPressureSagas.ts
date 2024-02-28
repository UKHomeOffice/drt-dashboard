import {  put, takeEvery } from 'redux-saga/effects';
import { setSearchType, setStartDate, setEndDate, addPortData, setPortTotals, addHistoricPortData, setHistoricPortTotals, setInterval } from './regionalPressureState';
import StubService from '../../services/stub-service';
import moment from 'moment';
// import ApiClient from '../../services/ApiClient';
// import axios from 'axios';

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

function* handleRequestPaxTotals(action: RequestPaxTotalsType) {
  try {
    const start = moment(action.startDate).startOf('day').format('YYYY-MM-DD');
    const end = action.searchType === 'single' ? start : moment(action.endDate).startOf('day').format('YYYY-MM-DD');
    const historicStart = moment(start).subtract(1, 'year').format('YYYY-MM-DD')
    const historicEnd = moment(end).subtract(1, 'year').format('YYYY-MM-DD')
    const interval = action.searchType === 'single' ? 'hours' : 'days';

    const current = StubService.generatePortPaxSeries(start, end, interval, 'region', ['INV', 'PIK', 'MAN', 'GLA', 'EDI', 'BRS', 'LGW', 'CWL','STN', 'EMA', 'LCY', 'SEN', 'LTN','T1', 'T2', 'T3', 'T4'])
    const historic = StubService.generatePortPaxSeries(historicStart, historicEnd, interval, 'region', ['INV', 'PIK', 'MAN', 'GLA', 'EDI', 'BRS', 'LGW', 'CWL','STN', 'EMA', 'LCY', 'SEN', 'LTN','T1', 'T2', 'T3', 'T4'])

    const ports: PortsObject = {};
    const portTotals: PortTotals = {};
    const historicPorts: PortsObject = {};
    const historicPortTotals: PortTotals = {};

    current.forEach((datapoint) => {
      datapoint.queueCounts.forEach(passengerCount => {
        portTotals[datapoint.portCode] = (portTotals[datapoint.portCode] ? portTotals[datapoint.portCode] : 0) + passengerCount.count
      })
      ports[datapoint.portCode] ?
      ports[datapoint.portCode].push(datapoint)
        : ports[datapoint.portCode] = [datapoint]
    })

    historic.forEach((datapoint) => {
      datapoint.queueCounts.forEach(passengerCount => {
        historicPortTotals[datapoint.portCode] = (historicPortTotals[datapoint.portCode] ? historicPortTotals[datapoint.portCode] : 0) + passengerCount.count
      })
      historicPorts[datapoint.portCode] ?
      historicPorts[datapoint.portCode].push(datapoint)
        : historicPorts[datapoint.portCode] = [datapoint]
    })

    yield(put(addPortData(ports)));
    yield(put(setPortTotals(portTotals)));
    yield(put(addHistoricPortData(historicPorts)));
    yield(put(setHistoricPortTotals(historicPortTotals)));
    yield(put(setSearchType(action.searchType)));
    yield(put(setStartDate(action.startDate)));
    yield(put(setEndDate(action.endDate)));
    yield(put(setInterval(action.searchType === 'single' ? 'hour' : 'day')))

  } catch (e) {
    console.log(e)
  }
}

export function* requestPaxTotalsSaga() {
  yield takeEvery('REQUEST_PAX_TOTALS', handleRequestPaxTotals)
}
