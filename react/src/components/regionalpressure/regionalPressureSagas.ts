import { call, put, takeEvery } from 'redux-saga/effects';
import { setSearchType, setStartDate, setEndDate } from './regionalPressureState';
import ApiClient from '../../services/ApiClient';
import axios from 'axios';

export type RequestPaxTotalsType = {
  type: "REQUEST_PAX_TOTALS",
  searchType: string,
  port: string,
  startDate: string,
  endDate: string,
};
export type PortTerminal = {
  port: string,
  ports: string[],
};

export const requestPaxTotals = (port: string, searchType: string, startDate: string, endDate: string) :RequestPaxTotalsType => {
  return {
    "type": "REQUEST_PAX_TOTALS",
    searchType,
    port,
    startDate,
    endDate
  };
};


function* handleRequestPaxTotals(action: RequestPaxTotalsType) {
  try {

    const ports = ['stn','lhr'];
    const granularity = 'hourly'
    const start = '2024-01-29'
    const end = '2024-01-29'

    const response: Response = yield call (axios.get, `${ApiClient.passengerTotalsEndpoint}${start}/${end}?granularity=${granularity}&port-codes=${ports.join()}`);
    console.log(response)

    yield(console.log, action);
    yield(put(setSearchType(action.searchType)));
    yield(put(setStartDate(action.startDate)));
    yield(put(setEndDate(action.endDate)));

  } catch (e) {
    console.log(e)
  }
}

export function* requestPaxTotalsSaga() {
  yield takeEvery('REQUEST_PAX_TOTALS', handleRequestPaxTotals)
}
