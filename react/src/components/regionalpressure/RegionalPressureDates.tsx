import * as React from 'react';
import {connect} from 'react-redux'
import {RootState} from '../../store/redux';
import moment from 'moment';
import { Typography } from '@mui/material';

interface RegionalPressureDateProps {
  forecastStart: string;
  forecastEnd: string;
  historicStart: string;
  historicEnd: string;
}

const RegionalPressureDates = ({forecastStart, forecastEnd, historicStart, historicEnd}: RegionalPressureDateProps) => {

  return (
    <>
      <Typography variant='body1'>
        <strong>Forecast arrivals: </strong>{ moment(forecastStart).format('dddd D MMM YYYY') }
        { forecastStart != forecastEnd &&
          <span> to { moment(forecastEnd).format('dddd D MMM YYYY') }</span>
        }
      </Typography>
      <Typography variant='body1'>
        <strong>Historical arrivals: </strong> { moment(historicStart).format('dddd D MMM YYYY') }
        { forecastStart != forecastEnd &&
          <span> to { moment(historicEnd).format('dddd D MMM YYYY') }</span>
        }
      </Typography>
    </>
  )
}

const mapState = (state: RootState) => {
  return {
    forecastStart: state.pressureDashboard?.forecastStart,
    forecastEnd: state.pressureDashboard?.forecastEnd,
    historicStart: state.pressureDashboard?.historicStart,
    historicEnd: state.pressureDashboard?.historicEnd,
   };
}

export default connect(mapState)(RegionalPressureDates);
