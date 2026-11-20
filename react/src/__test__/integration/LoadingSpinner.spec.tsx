import React from 'react';
import {act, render, screen as testingScreen} from '@testing-library/react';
import {Provider} from 'react-redux';
import {createStore} from 'redux';
import Loading from '../../components/Loading';
import DownloadModal from '../../components/downloadmanager/DownloadModal';
import NationalDashboard from '../../components/regionalpressure/NationalDashboard';

jest.mock('../../components/regionalpressure/RegionalPressureDates', () => () => null);
jest.mock('../../components/regionalpressure/RegionalPressureChart', () => () => null);
jest.mock('../../components/regionalpressure/RegionalPressureExport', () => () => null);
jest.mock('../../components/regionalpressure/RegionalPressureForm', () => () => null);

describe('loading indicators', () => {
  it('announces when the application is loading', () => {
    render(<Loading/>);

    expect(testingScreen.getByRole('status')).toHaveTextContent('Loading...');
  });

  it('shows the report spinner only while a report is being prepared', () => {
    const props = {downloadUrl: '/report', isModalOpen: true, handleModalClose: jest.fn()};
    const {rerender} = render(<DownloadModal {...props} status="preparing"/>);

    expect(testingScreen.getByRole('status')).toHaveTextContent('Creating your report...');
    expect(testingScreen.getByRole('link', {name: 'Download pending...'})).toHaveAttribute('aria-disabled', 'true');

    rerender(<DownloadModal {...props} status="complete"/>);
    expect(testingScreen.queryByRole('status')).not.toBeInTheDocument();
    expect(testingScreen.getByRole('link', {name: 'Download report'})).toHaveAttribute('href', '/report');

    rerender(<DownloadModal {...props} status="failed"/>);
    expect(testingScreen.queryByRole('status')).not.toBeInTheDocument();
    expect(testingScreen.getByText('There was a problem')).toBeInTheDocument();
  });

  it('shows the dashboard spinner only while dashboard data is loading', () => {
    const config = {
      portsByRegion: [],
      ports: [],
      domain: 'drt.localhost',
      teamEmail: 'drt@example.com',
    };
    const user = {email: 'user@example.com', ports: [], roles: []};
    const store = createStore((state = {pressureDashboard: {status: 'loading', errors: []}}, action) =>
      action.type === 'loaded' ? {pressureDashboard: {status: 'complete', errors: []}} : state
    );

    render(<Provider store={store}><NationalDashboard config={config} user={user}/></Provider>);

    expect(testingScreen.getByRole('status')).toHaveTextContent('Loading dashboard...');
    act(() => {
      store.dispatch({type: 'loaded'});
    });
    expect(testingScreen.queryByRole('status')).not.toBeInTheDocument();
    expect(testingScreen.getByRole('heading', {name: 'Regional overview'})).toBeInTheDocument();
  });
});
