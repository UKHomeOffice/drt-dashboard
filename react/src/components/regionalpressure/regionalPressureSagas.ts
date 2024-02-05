import {call, takeEvery } from 'redux-saga/effects'
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


    type Response = {
      data: object;
    }
    const result: Response = yield call(axios.get, `${ApiClient.paxTotals}/${action.port}/${action.startDate}/${action.endDate}`);

    console.log(result);

  } catch (e) {
    console.log(e)
  }
}

export function* requestPaxTotalsSaga() {
  yield takeEvery('REQUEST_PAX_TOTALS', handleRequestPaxTotals)
}
