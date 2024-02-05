import * as React from 'react';
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
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartData,
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
  data: ChartData<"radar", (number | null)[], string>;
}

const doesExceed = (forecast: number, historic: number): boolean => {
  return forecast > historic;
}

const RegionalPressureChart = ({regionName, data}: RegionalPressureChartProps) => {
  const theme = useTheme();
 
  const forecasts = data.datasets[0].data;
  const historics = data.datasets[1].data;

  const exceededForecasts = forecasts.map((forecast, index) => {return (doesExceed(forecast!, historics[index]!))});
  const exceededCount = exceededForecasts.filter(forecast => forecast).length;

  const chartOptions = {
    layout: {
      padding: 0
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
          <Radar data={data} options={chartOptions} />
          <Button component={Link} to={`/national-pressure/${regionName.toLocaleLowerCase()}`} fullWidth variant='contained'>More Info</Button>

          { exceededCount > 0 ?
              <Alert icon={<CheckCircle fontSize="inherit" />} severity="warning">
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


export default RegionalPressureChart;
