import * as React from 'react';
import {connect, MapDispatchToProps} from 'react-redux';
import {
  Box,
  Grid,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  TextField,
  Alert,
  Button,
} from "@mui/material";
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {UserProfile} from "../../model/User";
import {ConfigValues, PortRegion} from "../../model/Config";
import RegionalPressureChart from './ RegionalPressureChart';
import moment, {Moment} from 'moment';
import drtTheme from '../../drtTheme';
import {RootState} from '../../store/redux';
import { FormError } from '../../services/ValidationService';

import { requestPaxTotals } from './regionalPressureSagas';

interface RegionalPressureDashboardProps {
  user: UserProfile;
  config: ConfigValues;
  errors: FormError[];
  type?: string;
  start?: string;
  end?: string;
  requestRegion: (port: string, searchType: string, startDate: string, endDate: string) => void;
}

interface ErrorFieldMapping {
  [key:string]: boolean
}

interface RegionalPressureDates {
  start: Moment;
  end: Moment;
}

const generateTestData = (ports: string[]) => {
  return ports.map(() => Math.floor(Math.random() * (100 - -100 + 1) + -100))
}

const RegionalPressureDashboard = ({config, user, errors, type, start, end, requestRegion}: RegionalPressureDashboardProps) => {
  const [searchType, setSearchType] = React.useState<string>(type || 'single');
  const [dates, setDate] = React.useState<RegionalPressureDates>({
    start: moment(start).subtract(1, 'day'),
    end: moment(end),
  });
  const errorFieldMapping: ErrorFieldMapping = {}
  errors.forEach((error: FormError) => errorFieldMapping[error.field] = true);

  const isRccRegion = (regionName : string) => {
    return user.roles.includes("rcc:" + regionName.toLowerCase())
  }

  const userPortsByRegion: PortRegion[] = config.portsByRegion.map(region => {
    const userPorts: string[] = user.ports.filter(p => region.ports.includes(p));
    return {...region, ports: userPorts} as PortRegion
  }).filter(r => r.ports.length > 0 || isRccRegion(r.name))

  React.useEffect(() => {
    user.ports.map(port => requestRegion(port, searchType, dates.start.format('YYYY-MM-DD'), dates.end.format('YYYY-MM-DD')));
  }, [user, requestRegion, searchType, dates])

  const handleSearchTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchType(event.target.value);
    event.preventDefault();
  };

  const handleDateChange = (type: string, date: Moment | null) => {
    setDate({
      ...dates,
      [type]: date
    });
    if (type === 'start') {
      requestRegion('', searchType, date!.format('YYYY-MM-DD'), dates.end.format('YYYY-MM-DD'));
    }
  }

  return (
    <Box>
      <Box sx={{backgroundColor: '#E6E9F1', p: 2}}>

        
        <Grid container spacing={2} justifyItems={'stretch'} sx={{mb:2}}>
            <Grid item xs={12}>
              <h1>National Dashboard</h1>
              <h2>Compare pax arrivals vs previous year</h2>
            </Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel id="date-label">Set PAX Arrival date</FormLabel> 
                <RadioGroup
                  row
                  aria-labelledby="date-label"
                  onChange={handleSearchTypeChange}
                >
                  <FormControlLabel value="single" control={<Radio checked={searchType === 'single'} />} label="Single date" />
                  <FormControlLabel value="range" control={<Radio checked={searchType === 'range'} />} label="Date range" />
                </RadioGroup>
              </FormControl>
            </Grid>
        </Grid>

        
          <Grid container spacing={2} justifyItems={'stretch'} sx={{mb:2}}>
            <Grid item>
              <DatePicker 
                slots={{
                  textField: TextField
                }}
                slotProps={{
                  textField: { error: !!errorFieldMapping.startDate }
                }}
                label="From" 
                sx={{backgroundColor: '#fff', marginRight: '10px'}}
                value={dates.start}
                onChange={(newValue: Moment | null) => handleDateChange('start', newValue)}/>

              </Grid>
            { searchType === 'range' &&
              <Grid item>
                <DatePicker 
                  slots={{
                    textField: TextField
                  }}
                  slotProps={{
                    textField: { error: !!errorFieldMapping.endDate }
                  }}
                  label="To"  
                  sx={{backgroundColor: '#fff'}}
                  value={dates.end}
                  onChange={(newValue: Moment | null) => handleDateChange('end', newValue)}/>
                </Grid>
            }
              
            <Grid item>
              <Alert severity='info'>Historic average dates are 12 months before the arrivals date</Alert>
            </Grid>
          </Grid>
        

        <Grid container columnSpacing={2} justifyItems='stretch'>
            <Grid item xs={12}>
              <h3>Regional Overview</h3>
            </Grid>
            <Grid item xs={8}>
              <p style={{lineHeight: 1.6, marginTop: 0}}>
                <strong>Pax from selected date:</strong> { moment(start).format('ddd Do MMM YYYY') } to { moment(end).format('dd Do MMM YYYY') }
                <br/><strong>Pax from previous year:</strong> { moment(start).subtract(1,'y').format('ddd Do MMM YYYY') } to { moment(end).subtract(1,'y').format('dd Do MMM YYYY') }
              </p>
            </Grid>
            <Grid item xs={4} style={{textAlign: 'right'}}>
              <Button variant="outlined" sx={{backgroundColor: '#fff'}}>Export</Button>
            </Grid>
          {userPortsByRegion.map((region) => {

            let ports = region.name === "Heathrow" ? ['T1', 'T2', 'T3', 'T4'] : region.ports;

            const chartData = {
              labels: [...ports],
              datasets: [
                {
                  label: 'Forecasted PAX arrivals',
                  data: generateTestData(ports),
                  backgroundColor: 'rgba(0, 94, 165, 0.2)',
                  borderColor: drtTheme.palette.primary.main,
                  borderDash: [5, 5],
                  borderWidth: 1,
                },
                {
                  label: 'Historic PAX average',
                  data: ports.map(() => 0),
                  backgroundColor: 'transparent',
                  borderColor: '#547a00',
                  borderDash: [0,0],
                  borderWidth: 1,
                },
              ],
            };
            return <Grid key={region.name} item xs={12} md={6} lg={3}><RegionalPressureChart regionName={region.name} data={chartData} /></Grid>
          })}
        </Grid>
      </Box>
    </Box>
  )
  
}

const mapState = (state: RootState) => {
  return { 
    errors: state.pressureDashboard?.errors,
    type: state.pressureDashboard?.type,
    startDate: state.pressureDashboard?.start,
    endDate: state.pressureDashboard?.end,
   };
}

const mapDispatch = (dispatch :MapDispatchToProps<any, RegionalPressureDashboardProps>) => {
  return {
    requestRegion: (port: string, searchType: string, startDate: string, endDate: string) => {
      dispatch(requestPaxTotals(port, searchType, startDate, endDate));
    }
  };
};

export default connect(mapState, mapDispatch)(RegionalPressureDashboard);
