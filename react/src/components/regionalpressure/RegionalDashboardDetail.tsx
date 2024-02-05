import * as React from 'react';
import {connect} from 'react-redux';
import { useParams } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
} from "@mui/material";
import {UserProfile} from "../../model/User";
import {ConfigValues} from "../../model/Config";
import {RootState} from '../../store/redux';
import drtTheme from '../../drtTheme';
import { Line } from 'react-chartjs-2';import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  TimeScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-moment';
import moment, { Moment } from 'moment';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);


interface RegionalPressureDetailProps {
  user: UserProfile;
  config: ConfigValues;
  title?: string;
}

const generateRandomTimeSeries = (count: number, startDate: Moment) => {
  const d = moment(startDate);
  return Array.from(Array(count).keys()).map((key :number) => {
    return {
      x: d.add(key, 'days').format('MM/DD/YYYY'),
      y: Math.floor(Math.random() * (500 - 0 + 1) + 0)
    }
  })

}


const RegionalPressureDetail = ({config, user}: RegionalPressureDetailProps) => {
  const { region } = useParams()
  
  // const isRccRegion = (regionName : string) => {
  //   return user.roles.includes("rcc:" + regionName.toLowerCase())
  // }

  console.log(config.portsByRegion, user, region);
  const regionPorts = config.portsByRegion.filter((r) => r.name.toLowerCase() === region)[0].ports;
  console.log(regionPorts);

  return (
    <Box>
      <Box sx={{backgroundColor: '#E6E9F1', p: 2}}>

        <Grid container spacing={2} justifyItems={'stretch'} sx={{mb:2}}>
            <Grid item xs={12}>
              <h1 style={{textTransform: 'capitalize'}}>{`${region} Region`}</h1>
              <h2>Compare PAX arrivals vs historic average</h2>

              <p>Airports: { regionPorts.join(', ')}</p>
            </Grid>
            {
              regionPorts && regionPorts.map((port) => {

                const startDate = moment(new Date(new Date().valueOf() - Math.random()*(1e+12)));
                return (
                  <Grid item xs={12}>
                    <Card>
                      <CardHeader title={port} />
                      <CardContent>
                        <Divider />
                        <Line 
                          id={port}
                          key={port}
                          options={{
                            scales: {
                              x: {
                                type: 'time',
                                time: {
                                  unit: 'day'
                                }
                              },
                              y: {
                                grace: '10%'
                              }
                            }
                          }}
                          data={ {
                            datasets: [
                              {
                                label: 'Pax: <date>',
                                backgroundColor: 'rgba(0, 94, 165, 0.2)',
                                borderColor: drtTheme.palette.primary.main,
                                borderDash: [5, 5],
                                borderWidth: 1,
                                fill:{
                                  target: '+1',
                                  above: 'rgba(0, 94, 165, 0.2)',
                                  below: 'transparent',
                                },
                                data: generateRandomTimeSeries(20, startDate)
                              },
                              {
                                label: 'Pax previous year: <date>',
                                backgroundColor: 'transparent',
                                borderColor: '#547a00',
                                borderDash: [0,0],
                                borderWidth: 1,
                                data: generateRandomTimeSeries(20, startDate)
                              }
                            ]
                          }}
                          />

                      </CardContent>
                    </Card>
                  </Grid>
                )
              })
            }
        </Grid>

      </Box>
    </Box>
  )
  
}

const mapState = (state: RootState) => {
  return { 
    errors: state.pressureDashboard?.errors,
   };
}

export default connect(mapState)(RegionalPressureDetail);
