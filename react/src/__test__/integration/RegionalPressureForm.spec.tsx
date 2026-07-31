import * as React from 'react'
import moment from 'moment'
import {fireEvent, render, screen} from '@testing-library/react'
import {AdapterMoment} from '@mui/x-date-pickers/AdapterMoment'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {RegionalPressureForm} from '../../components/regionalpressure/RegionalPressureForm'

const renderForm = (requestRegion: jest.Mock = jest.fn()) => {
  render(
    <LocalizationProvider adapterLocale="en-gb" dateAdapter={AdapterMoment}>
      <RegionalPressureForm
        availablePorts={['LHR']}
        errors={[]}
        forecastEnd="2026-06-11"
        forecastStart="2026-06-10"
        historicEnd="2025-06-12"
        historicStart="2025-06-11"
        initialComparisonType="previousYear"
        ports={['LHR']}
        requestRegion={requestRegion}
        singleOrRange="single"
        status=""
      />
    </LocalizationProvider>
  )

  return requestRegion
}

describe('<RegionalPressureForm />', () => {
  it('requests data on mount with current defaults', () => {
    const requestRegion = renderForm()

    expect(requestRegion).toHaveBeenCalledTimes(1)
    expect(requestRegion).toHaveBeenLastCalledWith(
      ['LHR'],
      ['LHR'],
      'single',
      'previousYear',
      moment('2026-06-10').format('YYYY-MM-DD'),
      moment('2026-06-11').format('YYYY-MM-DD'),
      false,
      moment('2025-06-11').format('YYYY-MM-DD'),
      moment('2025-06-12').format('YYYY-MM-DD'),
    )
  })

  it('updates to date range and shows end date field', () => {
    const requestRegion = renderForm()

    fireEvent.click(screen.getByLabelText('Date range'))

    expect(requestRegion).toHaveBeenLastCalledWith(
      ['LHR'],
      ['LHR'],
      'range',
      'previousYear',
      moment('2026-06-10').format('YYYY-MM-DD'),
      moment('2026-06-11').format('YYYY-MM-DD'),
      false,
      moment('2025-06-11').format('YYYY-MM-DD'),
      moment('2025-06-12').format('YYYY-MM-DD'),
    )
    expect(screen.getAllByLabelText('To').length).toBeGreaterThan(0)
  })

  it('updates to custom comparison and reveals custom comparison date picker', () => {
    const requestRegion = renderForm()

    expect(screen.getAllByLabelText('Date')).toHaveLength(1)

    fireEvent.click(screen.getByLabelText('Custom date'))

    expect(requestRegion).toHaveBeenLastCalledWith(
      ['LHR'],
      ['LHR'],
      'single',
      'custom',
      moment('2026-06-10').format('YYYY-MM-DD'),
      moment('2026-06-11').format('YYYY-MM-DD'),
      false,
      moment('2025-06-11').format('YYYY-MM-DD'),
      moment('2025-06-12').format('YYYY-MM-DD'),
    )
    expect(screen.getAllByLabelText('Date')).toHaveLength(2)
  })

  it('switches custom comparison label when date range is selected', () => {
    renderForm()

    expect(screen.queryByLabelText('Custom date range')).toBeNull()

    fireEvent.click(screen.getByLabelText('Date range'))

    expect(screen.getByLabelText('Custom date range')).toBeInTheDocument()
  })
})
