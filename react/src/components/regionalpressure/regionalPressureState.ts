import {createSlice} from '@reduxjs/toolkit'
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
  }
});

export default regionalPressureSlice.reducer;
