import React from 'react';
import {render, screen as testingScreen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MemoryRouter, Route, Routes} from 'react-router-dom';
import {RegionalDashboard} from '../../components/regionalpressure/RegionalDashboard';

jest.mock('@drt/drt-react', () => ({
  ...jest.requireActual('@drt/drt-react'),
  Checkboxes: () => null,
  drtTheme: {palette: {grey: {800: '#505a5f'}}},
}));

jest.mock('patternomaly', () => ({draw: () => undefined}));
jest.mock('react-chartjs-2', () => ({Chart: () => null}));
jest.mock('../../components/regionalpressure/RegionalPressureDates', () => () => null);
jest.mock('../../components/regionalpressure/RegionalPressureForm', () => () => null);
jest.mock('../../components/regionalpressure/RegionalPressureExport', () => () => (
  <>
    <button>Export</button>
    <button>Download Manager</button>
  </>
));

describe('RegionalDashboard', () => {
  it('does not render a comparison chart when historic data is unavailable for a forecast port', () => {
    render(
      <MemoryRouter initialEntries={['/national-pressure/central']}>
        <Routes>
          <Route
            path="/national-pressure/:region"
            element={
              <RegionalDashboard
                config={{
                  portsByRegion: [{name: 'central', ports: ['MAN']}],
                  ports: [{iata: 'MAN', terminals: []}],
                  domain: 'drt.homeoffice.gov.uk',
                  teamEmail: 'drt@example.com',
                }}
                forecastHourlyPaxByPort={{
                  MAN: [{
                    bxQueueCounts: [],
                    date: '2026-10-12',
                    hour: 0,
                    portCode: 'MAN',
                    drtQueueCounts: [],
                    regionName: 'central',
                  }],
                }}
                historicHourlyPaxByPort={{}}
                interval="hour"
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(testingScreen.getByRole('heading', {name: 'central Region'})).toBeInTheDocument();
    expect(testingScreen.queryByText('Pax exceed previous year at highlighted times')).not.toBeInTheDocument();
  });

  it('provides a focusable airport arrivals link after the export controls in tab order', async () => {
    const user = userEvent.setup();
    const dataPoint = {
      bxQueueCounts: [],
      date: '2026-10-12',
      hour: 0,
      portCode: 'MAN',
      drtQueueCounts: [],
      regionName: 'central',
    };

    render(
      <MemoryRouter initialEntries={['/national-pressure/central']}>
        <Routes>
          <Route
            path="/national-pressure/:region"
            element={
              <RegionalDashboard
                config={{
                  portsByRegion: [{name: 'central', ports: ['MAN']}],
                  ports: [{iata: 'MAN', terminals: []}],
                  domain: 'drt-preprod.homeoffice.gov.uk',
                  teamEmail: 'drt@example.com',
                }}
                forecastHourlyPaxByPort={{MAN: [dataPoint]}}
                historicHourlyPaxByPort={{MAN: [dataPoint]}}
                interval="hour"
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    const arrivalsLink = testingScreen.getByRole('link', {name: 'View MAN arrivals'});

    expect(arrivalsLink).toHaveAttribute('href', 'https://MAN.drt-preprod.homeoffice.gov.uk');
    expect(arrivalsLink).toHaveClass('govuk-button');

    await user.tab();
    expect(testingScreen.getByRole('link', {name: 'Back to national pressure'})).toHaveFocus();
    await user.tab();
    expect(testingScreen.getByRole('button', {name: 'Export'})).toHaveFocus();
    await user.tab();
    expect(testingScreen.getByRole('button', {name: 'Download Manager'})).toHaveFocus();
    await user.tab();
    expect(testingScreen.getByRole('group', {name: 'MAN arrivals'})).toHaveFocus();
    await user.tab();
    expect(arrivalsLink).toHaveFocus();
  });

});









