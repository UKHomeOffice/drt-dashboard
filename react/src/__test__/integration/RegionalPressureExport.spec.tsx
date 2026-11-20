import React from 'react';
import {configureStore} from '@reduxjs/toolkit';
import {fireEvent, render, screen as testingScreen} from '@testing-library/react';
import {Provider} from 'react-redux';
import {MemoryRouter} from 'react-router-dom';
import {download} from 'export-to-csv';
import {enqueueSnackbar} from 'notistack';
import RegionalPressureExport from '../../components/regionalpressure/RegionalPressureExport';
import {PortsObject, TerminalDataPoint} from '../../components/regionalpressure/regionalPressureSagas';

jest.mock('export-to-csv', () => ({
  ...jest.requireActual('export-to-csv'),
  download: jest.fn(() => jest.fn()),
}));
jest.mock('notistack', () => ({enqueueSnackbar: jest.fn()}));

const point = (portCode: string, date: string, hour: number, bx: number, terminalName?: string): TerminalDataPoint => ({
  portCode,
  date,
  hour,
  regionName: 'North',
  terminalName,
  drtQueueCounts: [{queueName: 'EGate', count: 10}, {queueName: 'Desk', count: 5}],
  bxQueueCounts: [{queueName: 'EGate', count: bx}, {queueName: 'Desk', count: 2}],
});

const renderExport = (forecast: PortsObject, historic: PortsObject, interval: 'hour' | 'day') => {
  const store = configureStore({
    reducer: {
      pressureDashboard: () => ({
        forecastHourlyPaxByPort: forecast,
        historicHourlyPaxByPort: historic,
        interval,
        forecastStart: '2026-03-28',
        historicStart: '2025-03-29',
      }),
    },
  });
  render(<Provider store={store}><MemoryRouter><RegionalPressureExport /></MemoryRouter></Provider>);
};

const downloadedRows = () => {
  const downloadCsv = jest.mocked(download).mock.results[0].value;
  const csv = jest.mocked(downloadCsv).mock.calls[0][0];
  return String(csv).replace(/^\uFEFF/, '').trim().split(/\r?\n/).map(row =>
    row.split(',').map(cell => cell.replace(/^"|"$/g, '')),
  );
};

beforeEach(() => {
  jest.mocked(download).mockImplementation(() => jest.fn());
});

describe('regional pressure export', () => {
  it('exports matching hourly slots without shifting missing or out-of-order history', () => {
    renderExport({
      MAN: [
        point('MAN', '2026-03-28', 0, 0), point('MAN', '2026-03-28', 1, 0),
        point('MAN', '2026-03-28', 2, 0), point('MAN', '2026-03-29', 2, 0),
      ],
      LHR: [point('LHR', '2026-03-28', 0, 0)],
      'LHR-T2': [point('LHR', '2026-03-28', 0, 0, 'T2')],
    }, {
      MAN: [
        point('MAN', '2025-03-30', 2, 30),
        point('MAN', '2025-03-29', 2, 22), point('MAN', '2025-03-29', 0, 20),
      ],
    }, 'hour');

    fireEvent.click(testingScreen.getByRole('button', {name: 'Export'}));

    expect(downloadedRows()).toEqual([
      ['Forecast date', 'Historical date', 'Port code', 'Region name', 'DRT total pax', 'DRT e-gate pax', 'DRT desk pax', 'BX total pax', 'BX e-gate pax', 'BX desk pax'],
      ['00:00 28-03-2026', '00:00 29-03-2025', 'MAN', 'North', '15', '10', '5', '22', '20', '2'],
      ['01:00 28-03-2026', '', 'MAN', 'North', '15', '10', '5', '', '', ''],
      ['02:00 28-03-2026', '02:00 29-03-2025', 'MAN', 'North', '15', '10', '5', '24', '22', '2'],
      ['02:00 29-03-2026', '02:00 30-03-2025', 'MAN', 'North', '15', '10', '5', '32', '30', '2'],
      ['00:00 28-03-2026', '', 'LHR', 'North', '15', '10', '5', '', '', ''],
    ]);
  });

  it('matches daily records by date offset across a clock change, preserving zero counts', () => {
    const zeroHistory = {...point('MAN', '2025-03-31', 0, 0), bxQueueCounts: []};
    renderExport({
      MAN: [point('MAN', '2026-03-28', 0, 0), point('MAN', '2026-03-30', 0, 0)],
    }, {
      MAN: [zeroHistory],
    }, 'day');

    fireEvent.click(testingScreen.getByRole('button', {name: 'Export'}));

    expect(downloadedRows().slice(1)).toEqual([
      ['28-03-2026', '', 'MAN', 'North', '15', '10', '5', '', '', ''],
      ['30-03-2026', '31-03-2025', 'MAN', 'North', '15', '10', '5', '0', '0', '0'],
    ]);
  });

  it('notifies the user when there are no forecast rows to export', () => {
    renderExport({}, {}, 'hour');
    fireEvent.click(testingScreen.getByRole('button', {name: 'Export'}));

    expect(download).not.toHaveBeenCalled();
    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'There is no forecast data to export for the selected dates.',
      {variant: 'warning'},
    );
  });
});
