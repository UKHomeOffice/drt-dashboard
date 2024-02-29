import * as React from 'react';
import {connect} from 'react-redux';
import {
  Alert,
  Card,
  CardContent,
  CardHeader,
  Button,
  Stack,
  useTheme,
} from "@mui/material";
import {Link} from "react-router-dom";
import { CheckCircle } from '@mui/icons-material';
import ErrorIcon from '@mui/icons-material/Error';
import {RootState} from '../../store/redux';
import drtTheme from '../../drtTheme';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface RegionalPressureChartProps {
  regionName: string;
  portCodes: string[];
  portTotals: {
    [key: string] : number
  };
  historicPortTotals: {
    [key: string] : number
  };
}

const doesExceed = (forecast: number, historic: number): boolean => {
  return forecast > historic;
}

const RegionalPressureChart = ({regionName, portCodes, portTotals, historicPortTotals}: RegionalPressureChartProps) => {
  const theme = useTheme();

  const forecasts = [...portCodes].map(portCode => portTotals[portCode]);
  const historics = [...portCodes].map(portCode => historicPortTotals[portCode]);

  const chartData = {
    labels: portCodes,
    datasets: [
      {
        label: 'Forecasted PAX arrivals',
        data: forecasts,
        backgroundColor: 'rgba(0, 94, 165, 0.2)',
        borderColor: drtTheme.palette.primary.main,
        borderDash: [5, 5],
        pointStyle: 'rectRot',
        borderWidth: 1,
      },
      {
        label: 'Historic PAX average',
        data: historics,
        backgroundColor: 'transparent',
        borderColor: '#547a00',
        pointStyle: 'circle',
        pointBackgroundColor: '#547a00',
        borderDash: [0,0],
        borderWidth: 1,
      },
    ],
  };

  const exceededForecasts = forecasts.map((forecast, index) => {return (doesExceed(forecast!, historics[index]!))});
  const exceededCount = exceededForecasts.filter(forecast => forecast).length;

  const chartOptions = {
    layout: {
      padding: 0
    },
    plugins: {
      legend: {
        labels: {
          usePointStyle: true,
        }
      }
    },
    scales: {
      r: {
        pointLabels: {
          callback: (label: string, index: number): string | number | string[] | number[] => {
            return doesExceed(forecasts[index]!, historics[index]!) ? `⚠ ${label}` : `${label}`;
          },
          font: {
            weight: (context: any) => {
              return doesExceed(forecasts[context.index]!, historics[context.index]!) ? 'bold' : 'normal'
            }
          },
          color: (context: any) => {
            return doesExceed(forecasts[context.index]!, historics[context.index]!) ? theme.palette.warning.main : 'black';
          },
        },
      }
    }
  }

  return (
    <Card variant='outlined'>
      <CardHeader title={regionName} />
      <CardContent>
        <Stack sx={{ width: '100%' }} spacing={2}>
          <Radar data={chartData} options={chartOptions} />
          <Button component={Link} to={`/national-pressure/${regionName.toLocaleLowerCase()}`} fullWidth variant='contained'>More Info</Button>

          { exceededCount > 0 ?
              <Alert icon={<ErrorIcon fontSize="inherit" />} severity="info">
                {`PAX arrivals exceeds historic average across ${exceededCount} airports`}
              </Alert>
            :
              <Alert icon={<CheckCircle fontSize="inherit" />} severity="success">
                Pax arrivals do not exceed historic average at any airport
              </Alert>
          }
        </Stack>
      </CardContent>
    </Card>
  )
  
}


const mapState = (state: RootState) => {
  return { 
    portTotals: state.pressureDashboard?.portTotals,
    historicPortTotals: state.pressureDashboard?.historicPortTotals,
   };
}


export default connect(mapState)(RegionalPressureChart);