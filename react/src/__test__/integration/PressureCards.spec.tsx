import React from 'react';
import {configureStore} from '@reduxjs/toolkit';
import {fireEvent, render, screen as testingScreen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Provider} from 'react-redux';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import RegionalPressureChart from '../../components/regionalpressure/RegionalPressureChart';
import {RegionalDashboard} from '../../components/regionalpressure/RegionalDashboard';

jest.mock('react-chartjs-2', () => ({
  Radar: ({'aria-label': label}: {'aria-label': string}) => <div role="img" aria-label={label}>Radar chart</div>,
  Chart: ({'aria-label': label}: {'aria-label': string}) => <div role="img" aria-label={label}>Line chart</div>,
}));
jest.mock('patternomaly', () => ({draw: () => undefined}));
jest.mock('../../components/regionalpressure/RegionalPressureDates', () => () => null);
jest.mock('../../components/regionalpressure/RegionalPressureForm', () => () => null);
jest.mock('../../components/regionalpressure/RegionalPressureExport', () => () => null);

describe('pressure dashboard cards', () => {
  it('shows the regional chart and status and navigates to the region', async () => {
    const user = userEvent.setup();
    const store = configureStore({
      reducer: {
        pressureDashboard: () => ({
          forecastTotalPaxByPort: {MAN: 120},
          historicTotalPaxByPort: {MAN: 100},
        }),
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/national-pressure']}>
          <Routes>
            <Route path="/national-pressure" element={<RegionalPressureChart regionName="Central" portCodes={['MAN']} />} />
            <Route path="/national-pressure/central" element={<p>Central dashboard</p>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(testingScreen.getByRole('heading', {name: 'Central Region', level: 3})).toBeInTheDocument();
    expect(testingScreen.getByRole('img', {name: 'Central Region forecast arrivals compared with historical arrivals'})).toBeInTheDocument();
    expect(testingScreen.getByText('Pax number exceeds previous year at 1 airports')).toBeInTheDocument();
    await user.tab();
    expect(testingScreen.getByRole('group', {name: 'Central Region'})).toHaveFocus();
    await user.tab();
    expect(testingScreen.getByRole('button', {name: 'View Central region'})).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(testingScreen.getByText('Central dashboard')).toBeInTheDocument();
  });

  it('shows the success status and Heathrow navigation when forecasts do not exceed history', () => {
    const store = configureStore({
      reducer: {
        pressureDashboard: () => ({
          forecastTotalPaxByPort: {'LHR-T2': 100},
          historicTotalPaxByPort: {'LHR-T2': 100},
        }),
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/national-pressure']}>
          <RegionalPressureChart regionName="Heathrow" portCodes={['LHR-T2']} />
        </MemoryRouter>
      </Provider>,
    );

    expect(testingScreen.getByRole('heading', {name: 'Heathrow', level: 3})).toBeInTheDocument();
    expect(testingScreen.getByText('Pax number does not exceed previous year at any airport')).toBeInTheDocument();
    expect(testingScreen.getByRole('button', {name: 'View Heathrow'})).toBeInTheDocument();
  });

  it('provides keyboard access to a named terminal card and its arrivals link', async () => {
    const user = userEvent.setup();
    const dataPoint = {
      bxQueueCounts: [],
      date: '2026-10-12',
      hour: 0,
      portCode: 'LHR-T2',
      drtQueueCounts: [],
      regionName: 'Heathrow',
    };

    render(
      <MemoryRouter initialEntries={['/national-pressure/heathrow']}>
        <Routes>
          <Route
            path="/national-pressure/:region"
            element={
              <RegionalDashboard
                config={{
                  portsByRegion: [{name: 'Heathrow', ports: ['LHR']}],
                  ports: [{iata: 'LHR', terminals: []}],
                  domain: 'drt.example.org',
                  teamEmail: 'team@example.org',
                }}
                forecastHourlyPaxByPort={{'LHR-T2': [dataPoint], 'LHR-T3': [dataPoint]}}
                historicHourlyPaxByPort={{'LHR-T2': [dataPoint]}}
                interval="hour"
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(testingScreen.getByRole('heading', {name: 'LHR T2', level: 3})).toBeInTheDocument();
    expect(testingScreen.getByRole('img', {name: 'LHR T2 forecast and historical arrivals chart'})).toBeInTheDocument();
    expect(testingScreen.getByText('Pax exceed previous year at highlighted times')).toBeInTheDocument();
    expect(testingScreen.getByRole('link', {name: 'View LHR T2 arrivals'})).toHaveAttribute('href', 'https://lhr.drt.example.org');
    expect(testingScreen.queryByRole('heading', {name: 'LHR T3'})).not.toBeInTheDocument();

    const card = testingScreen.getByRole('group', {name: 'LHR T2 arrivals'});
    for (let i = 0; i < 10 && document.activeElement !== card; i++) await user.tab();
    expect(card).toHaveFocus();
    await user.tab();
    expect(testingScreen.getByRole('link', {name: 'View LHR T2 arrivals'})).toHaveFocus();

    fireEvent.click(testingScreen.getByRole('checkbox', {name: 'LHR T2'}));
    expect(testingScreen.queryByRole('heading', {name: 'LHR T2'})).not.toBeInTheDocument();
    expect(testingScreen.queryByRole('link', {name: 'View LHR T2 arrivals'})).not.toBeInTheDocument();
  });
});
