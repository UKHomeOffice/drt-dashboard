import * as React from 'react';
import {connect} from 'react-redux';
import { useParams } from 'react-router-dom'
import {
  Alert,
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Stack
} from "@mui/material";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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
import moment from 'moment';
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
import { TerminalDataPoint } from './regionalPressureSagas';


interface RegionalPressureDetailProps {
  user: UserProfile;
  config: ConfigValues;
  title?: string;
  start?: string;
  end?: string;
  interval?: string;
  portData: {
    [key: string]: TerminalDataPoint[]
  };
}

const convertToTimeSeries = (portData:  TerminalDataPoint[], queueName: string) => {
  console.log(portData);
  return portData.map((datapoint: TerminalDataPoint) => {
    return {
      x: moment(datapoint.date).add(datapoint.hour, 'hours').format('MM/DD/YYYY HH:MM'),
      y: (datapoint.queueCounts.find(queueData => queueData.queueName === queueName)?.count || 10 ) * Math.random() * 1.5,
    }
  })
}


const RegionalPressureDetail = ({config, start, end, portData, interval}: RegionalPressureDetailProps) => {
  const { region } = useParams()
  const regionPorts = config.portsByRegion.filter((r) => r.name.toLowerCase() === region)[0].ports;

  const timeUnits = interval;

  return (
    <Box>
      <Box sx={{backgroundColor: '#E6E9F1', p: 2}}>

        <Grid container spacing={2} justifyItems={'stretch'} sx={{mb:2}}>
            <Grid item xs={12}>
              <h1 style={{textTransform: 'capitalize', marginTop: '0.2em'}}>{`${region} Region`}</h1>
              <h2>Compare pax arrivals vs previous year</h2>
            </Grid>
            <Grid item xs={10}>
              <p style={{lineHeight: 1.6, marginTop: 0}}>
                <strong>Pax from selected date:</strong> { moment(start).format('ddd Do MMM YYYY') } to { moment(end).format('dd Do MMM YYYY') }
                <br/><strong>Pax from previous year:</strong> { moment(start).subtract(1,'y').format('ddd Do MMM YYY') } to { moment(end).subtract(1,'y').format('dd Do MMM YYYY') }
              </p>
              <p>Airports: { regionPorts.join(', ')}</p>
            </Grid>
            <Grid item xs={2}>
              <Stack spacing={2}>
               <Button variant="outlined"><FilterAltIcon />Filter</Button>
                <Button variant="outlined"><ArrowDownwardIcon />Export</Button>
              </Stack>
            </Grid>
            { regionPorts && regionPorts.map((port: string) => {
                return portData[port] && (
                  <Grid item xs={12}>
                    <Card>
                      <CardHeader 
                        title={port}
                        action={
                          <Button variant="contained" href={`http://${port}.drt.homeoffice.gov.uk`}>View {port} arrivals</Button>
                        } 
                        />
                      <CardContent>
                        {/* <Divider /> */}
                        <Alert severity="info">Pax exceed previous year at highlighted times</Alert>
                        <Line 
                          id={port}
                          key={port}
                          options={{
                            layout: {
                              padding: {
                                top: 10
                              }
                            },
                            plugins: {
                              legend: {
                                align: 'start',
                                title: {
                                  padding: 20
                                },
                                labels: {
                                  usePointStyle: true,
                                }
                              }
                            },
                            scales: {
                              x: {
                                border: {
                                  display: true
                                },
                                type: 'time',
                                time: {
                                  unit: timeUnits as "hour"
                                },
                                grid: {
                                  display: true,
                                  drawOnChartArea: true,
                                  drawTicks: true
                                }
                              },
                              y: {
                                type: 'linear',
                                min: 0,
                                offset: true,
                                grace: '10%',
                                grid: {
                                  display: true,
                                },
                              }
                            }
                          }}
                          plugins={[
                            {
                              id: "increase-legend-spacing",
                              beforeInit(chart) {
                                // Get reference to the original fit function
                                const originalFit = (chart.legend as any).fit;
                                // Override the fit function
                                (chart.legend as any).fit = function fit() {
                                  // Call original function and bind scope in order to use `this` correctly inside it
                                  originalFit.bind(chart.legend)();
                                  this.height += 20;
                                };
                              }
                            }
                          ]}
                          data={ {
                            datasets: [
                              {
                                label: `Pax: ${moment(start).format('ddd Do MMM YYYY') } to ${ moment(end).format('ddd Do MMM YYYY') }`,
                                backgroundColor: 'rgba(0, 94, 165, 0.2)',
                                borderColor: drtTheme.palette.primary.main,
                                borderDash: [5, 5],
                                borderWidth: 1,
                                pointStyle: 'rectRot',
                                fill:{
                                  target: '+1',
                                  above: 'rgba(0, 94, 165, 0.2)',
                                  below: 'transparent',
                                },
                                data: convertToTimeSeries(portData[port], 'EEA')
                              },
                              {
                                label: `Pax previous year: ${ moment(start).subtract(1,'y').format('ddd Do MMM YYYY') } to ${ moment(end).subtract(1,'y').format('ddd Do MMM YYYY') }`,
                                backgroundColor: 'transparent',
                                borderColor: '#547a00',
                                borderDash: [0,0],
                                borderWidth: 1,
                                pointStyle: 'circle',
                                pointBackgroundColor: '#547a00',
                                data: convertToTimeSeries(portData[port], 'EEA')
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
    startDate: state.pressureDashboard?.start,
    endDate: state.pressureDashboard?.end,
    portData: state.pressureDashboard?.portData,
    interval: state.pressureDashboard?.interval,
   };
}

export default connect(mapState)(RegionalPressureDetail);
