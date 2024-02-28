import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import { FormError } from '../../services/ValidationService'
import { TerminalDataPoint } from './regionalPressureSagas'

interface RegionalPressureState {
  errors: FormError[],
  type: string,
  start: string,
  end: string,
  interval: string,
  portData: {
    [key: string] : TerminalDataPoint[]
  },
  portTotals: {
    [key: string] : number
  }
  historicPortData: {
    [key: string] : TerminalDataPoint[]
  },
  historicPortTotals: {
    [key: string] : number
  }
}

const regionalPressureSlice = createSlice({
  name: 'regionalPressure',
  initialState: {
    portData: {},
    portTotals: {},
    historicPortData: {},
    historicPortTotals: {},
    errors: [],
    type: "single",
    start: new Date().toString(),
    end: new Date().toString(),
    interval: "daily",
  } as RegionalPressureState,
  reducers: {
    setSearchType: (state: RegionalPressureState, action: PayloadAction<string>) => {
      state.type = action.payload;
    },
    setStartDate: (state: RegionalPressureState, action: PayloadAction<string>) => {
      state.start = action.payload;
    },
    setEndDate: (state: RegionalPressureState, action: PayloadAction<string>) => {
      state.end = action.payload;
    },
    setInterval: (state: RegionalPressureState, action: PayloadAction<string>) => {
      state.interval = action.payload;
    },
    addPortData: (state: RegionalPressureState, action: PayloadAction<object>) => {
      state.portData = {...action.payload}
    },
    setPortTotals: (state: RegionalPressureState, action: PayloadAction<object>) => {
      state.portTotals = {...action.payload}
    },
    addHistoricPortData: (state: RegionalPressureState, action: PayloadAction<object>) => {
      state.historicPortData = {...action.payload}
    },
    setHistoricPortTotals: (state: RegionalPressureState, action: PayloadAction<object>) => {
      state.historicPortTotals = {...action.payload}
    }
  }
});

export const {
  setSearchType,
  setStartDate,
  setEndDate,
  addPortData,
  setPortTotals,
  addHistoricPortData,
  setHistoricPortTotals,
  setInterval
} = regionalPressureSlice.actions;

export default regionalPressureSlice.reducer;
