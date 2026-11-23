import * as React from 'react';
import {connect} from 'react-redux'
import {RootState} from '../../store/redux';
import {useNavigate} from 'react-router';
import {Button as DrtButton} from '@drt/drt-react';
import {paxByGateType, TerminalDataPoint} from './regionalPressureSagas';
import {mkConfig, generateCsv, download} from "export-to-csv";
import {PortsObject} from './regionalPressureSagas';
import ArrowDownward from '@mui/icons-material/ArrowDownward';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';
import moment from 'moment';
import {enqueueSnackbar} from 'notistack';

interface RegionalPressureExportProps {
  granularity: 'hour' | 'day',
  forecastHourlyPaxByPort: {
    [key: string]: TerminalDataPoint[]
  };
  historicHourlyPaxByPort: {
    [key: string]: TerminalDataPoint[]
  };
  forecastStart: string;
  historicStart: string;
}

type ExportDataPoint = {
  forecastDate: string,
  historicDate: string,
  portCode: string,
  regionName: string,
  terminalName?: string,
  drtTotalPax: number,
  drtEgatePax: number,
  drtDeskPax: number,
  bxTotalPax: number | string,
  bxEgatePax: number | string,
  bxDeskPax: number | string,
}

const constructCsvRows = (
  forecast: PortsObject,
  historic: PortsObject,
  granularity: 'hour' | 'day',
  forecastStart: string,
  historicStart: string,
) => {
  const rows: ExportDataPoint[] = []
  const slot = (point: TerminalDataPoint, start: string) => {
    const day = moment.utc(point.date).startOf('day').diff(moment.utc(start).startOf('day'), 'days')
    return granularity === 'hour' ? `${day}:${point.hour}` : `${day}`
  }
  const formatDate = (point: TerminalDataPoint) => {
    const date = moment(point.date).format('DD-MM-YYYY')
    return granularity === 'hour' ? `${String(point.hour).padStart(2, '0')}:00 ${date}` : date
  }

  Object.keys(forecast).forEach((port: string) => {
    const historicBySlot = new Map<string, TerminalDataPoint[]>()
    const historicPoints = historic[port] || []
    historicPoints.filter(point => !point.terminalName).forEach(point => {
      const key = slot(point, historicStart)
      const points = historicBySlot.get(key) || []
      points.push(point)
      historicBySlot.set(key, points)
    })

    forecast[port]
      .filter((portDataPoint) => !portDataPoint.terminalName)
      .forEach((portDataPoint) => {
        const historicDataPoint = historicBySlot.get(slot(portDataPoint, forecastStart))?.shift()
        const [drtEgatePax, drtDeskPax] = paxByGateType(portDataPoint.drtQueueCounts)
        const historicPax = historicDataPoint ? paxByGateType(historicDataPoint.bxQueueCounts) : undefined

        const exportDataPoint: ExportDataPoint = {
          forecastDate: formatDate(portDataPoint),
          historicDate: historicDataPoint ? formatDate(historicDataPoint) : '',
          portCode: portDataPoint.portCode || '',
          regionName: portDataPoint.regionName || '',
          drtTotalPax: drtEgatePax + drtDeskPax,
          drtEgatePax: drtEgatePax,
          drtDeskPax: drtDeskPax,
          bxTotalPax: historicPax ? historicPax[0] + historicPax[1] : '',
          bxEgatePax: historicPax ? historicPax[0] : '',
          bxDeskPax: historicPax ? historicPax[1] : '',
        }
        rows.push(exportDataPoint)
      })
  })

  return rows
}

const RegionalPressureExport = ({forecastHourlyPaxByPort, historicHourlyPaxByPort, granularity, forecastStart, historicStart}: RegionalPressureExportProps) => {

  const navigate = useNavigate();

  const csvConfig = mkConfig({
    filename: `regional-pressure-export`,
    useKeysAsHeaders: false,
    columnHeaders: [
      {key: 'forecastDate', displayLabel: 'Forecast date'},
      {key: 'historicDate', displayLabel: 'Historical date'},
      {key: 'portCode', displayLabel: 'Port code'},
      {key: 'regionName', displayLabel: 'Region name'},
      {key: 'drtTotalPax', displayLabel: 'DRT total pax'},
      {key: 'drtEgatePax', displayLabel: 'DRT e-gate pax'},
      {key: 'drtDeskPax', displayLabel: 'DRT desk pax'},
      {key: 'bxTotalPax', displayLabel: 'BX total pax'},
      {key: 'bxEgatePax', displayLabel: 'BX e-gate pax'},
      {key: 'bxDeskPax', displayLabel: 'BX desk pax'},
    ]
  });

  const handleExport = () => {
    const csvRows = constructCsvRows(forecastHourlyPaxByPort, historicHourlyPaxByPort, granularity, forecastStart, historicStart)
    if (csvRows.length === 0) {
      enqueueSnackbar('There is no forecast data to export for the selected dates.', {variant: 'warning'})
      return
    }
    const csv = generateCsv(csvConfig)(csvRows);
    download(csvConfig)(csv)
  }

  return <div style={{display: 'flex', gap: '0.5rem', width: '100%'}}>
    <DrtButton
      fullWidth
      startIcon={<ArrowDownward sx={{fontSize: 'inherit'}} />}
      variant="primary"
      onClick={handleExport}>Export</DrtButton>
    <DrtButton
      fullWidth
      startIcon={<BrowserUpdatedIcon sx={{fontSize: 'inherit'}} />}
      variant="secondary"
      onClick={() => navigate('/download')}>Download Manager</DrtButton>
  </div>
}


const mapState = (state: RootState) => {
  return {
    forecastHourlyPaxByPort: state.pressureDashboard?.forecastHourlyPaxByPort,
    historicHourlyPaxByPort: state.pressureDashboard?.historicHourlyPaxByPort,
    granularity: state.pressureDashboard?.interval,
    forecastStart: state.pressureDashboard?.forecastStart,
    historicStart: state.pressureDashboard?.historicStart,
  };
}

export default connect(mapState)(RegionalPressureExport);
