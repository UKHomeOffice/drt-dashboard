import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import { FormError } from '../../services/ValidationService'

interface RegionalPressureState {
  errors: FormError[],
  type: string
  start: string
  end: string
}

const regionalPressureSlice = createSlice({
  name: 'regionalPressure',
  initialState: {
    errors: [],
    type: "single",
    start: new Date().toString(),
    end: new Date().toString(),
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
  }
});

export const {
  setSearchType,
  setStartDate,
  setEndDate,
} = regionalPressureSlice.actions;

export default regionalPressureSlice.reducer;
