import * as React from 'react'
import {connect, MapDispatchToProps} from 'react-redux'
import {RootState} from '../../store/redux'
import {Grid} from '@mui/material'
import {Radios} from '@drt/drt-react'
import {DatePicker} from '@mui/x-date-pickers/DatePicker'
import {requestPaxTotals} from './regionalPressureSagas'
import moment, {Moment} from 'moment'
import {ErrorFieldMapping, FormError} from '../../services/ValidationService'
import {getHistoricDateByDay} from "./regionalPressureState";

interface RegionalPressureFormProps {
    errors: FormError[]
    ports: string[]
    availablePorts: string[]
    singleOrRange: 'single' | 'range'
    initialComparisonType: 'previousYear' | 'custom',
    forecastStart: string
    forecastEnd: string
    historicStart: string
    historicEnd: string
    status: string
    requestRegion: (ports: string[], availablePorts: string[], singleOrRange: 'single' | 'range', comparisonType: 'previousYear' | 'custom', forecastStart: string, forecastEnd: string, isExport: boolean, historicStart: string, historicEnd: string) => void
}

interface RegionalPressureDatesState {
    start: Moment
    end: Moment
}

export const RegionalPressureForm = ({
                                  ports,
                                  errors,
                                  availablePorts,
                                  forecastStart,
                                  forecastEnd,
                                  historicStart,
                                  historicEnd,
                                  singleOrRange,
                                  initialComparisonType,
                                  requestRegion
                              }: RegionalPressureFormProps) => {
    const [searchType, setSearchType] = React.useState<'single' | 'range'>(singleOrRange)
    const [comparisonType, setComparisonType] = React.useState<'previousYear' | 'custom'>(initialComparisonType)
    const [forecastDates, setForecastDates] = React.useState<RegionalPressureDatesState>({
        start: moment(forecastStart),
        end: moment(forecastEnd),
    })
    const [historicDates, setHistoricDates] = React.useState<RegionalPressureDatesState>({
        start: moment(historicStart),
        end: moment(historicEnd),
    })
    const errorFieldMapping: ErrorFieldMapping = {}
    errors.forEach((error: FormError) => errorFieldMapping[error.field] = true)

    React.useEffect(() => {
        requestRegion(
            ports,
            availablePorts,
            searchType,
            comparisonType,
            forecastDates.start.format('YYYY-MM-DD'),
            forecastDates.end.format('YYYY-MM-DD'),
            false,
            historicDates.start.format('YYYY-MM-DD'),
            historicDates.end.format('YYYY-MM-DD'),
        )
    }, [])

    const handleSearchTypeChange = (value: string) => {
        const singleOrRange = value as 'single' | 'range';
        setSearchType(singleOrRange)
        requestRegion(
            ports,
            availablePorts,
            singleOrRange,
            comparisonType,
            forecastDates.start.format('YYYY-MM-DD'),
            forecastDates.end.format('YYYY-MM-DD'),
            false,
            historicDates.start.format('YYYY-MM-DD'),
            historicDates.end.format('YYYY-MM-DD'),
        )
    }

    const handleDateChange = (type: string, date: Moment) => {
        const forecastStart: Moment = type == 'start' ? date : forecastDates.start
        const forecastEnd = type == 'end' ? date : forecastDates.end
        const historicStart = comparisonType == 'previousYear' ? getHistoricDateByDay(forecastStart) : historicDates.start
        const historicEnd = comparisonType == 'previousYear' ? getHistoricDateByDay(forecastEnd) : historicDates.end

        setForecastDates({
            start: forecastStart,
            end: forecastEnd
        })

        setHistoricDates({
            start: historicStart,
            end: historicEnd
        })

        requestRegion(
            ports,
            availablePorts,
            searchType,
            comparisonType,
            forecastStart.format('YYYY-MM-DD'),
            forecastEnd.format('YYYY-MM-DD'),
            false,
            historicStart.format('YYYY-MM-DD'),
            historicEnd.format('YYYY-MM-DD'),
        )
    }

    const handleComparisonTypeChange = (value: string) => {
        const comparisonType = value as 'previousYear' | 'custom'

        const historicStart = comparisonType === 'custom' ?
            historicDates.start :
            getHistoricDateByDay(forecastDates.start)

        const historicEnd = comparisonType === 'custom' ?
            historicDates.end :
            getHistoricDateByDay(forecastDates.end)

        setComparisonType(comparisonType)
        setHistoricDates({
            start: historicStart,
            end: historicEnd
        })

        requestRegion(
            ports,
            availablePorts,
            searchType,
            comparisonType,
            forecastDates.start.format('YYYY-MM-DD'),
            forecastDates.end.format('YYYY-MM-DD'),
            false,
            historicStart.format('YYYY-MM-DD'),
            historicEnd.format('YYYY-MM-DD'),
        )
    }

    const handleComparisonDateChange = (type: string, comparisonDate: Moment) => {
        const duration = moment.duration(forecastDates.end.diff(forecastDates.start)).asHours()
        const comparisonEnd = moment(comparisonDate).add(duration, 'hours')

        setHistoricDates({
            start: comparisonDate,
            end: comparisonEnd
        })

        requestRegion(
            ports,
            availablePorts,
            searchType,
            comparisonType,
            forecastDates.start.format('YYYY-MM-DD'),
            forecastDates.end.format('YYYY-MM-DD'),
            false,
            comparisonDate.format('YYYY-MM-DD'),
            comparisonEnd.format('YYYY-MM-DD'),
        )
    }

    return (
        <>
            <Grid container spacing={2} justifyItems={'stretch'} sx={{mb: 2}}>
                <Grid item xs={12}>
                    <Radios
                        name="searchType"
                        label="Select date for forecast arrivals"
                        inline
                        small
                        value={searchType}
                        onChange={handleSearchTypeChange}
                        options={[
                            { value: 'single', label: 'Single\u00A0date' },
                            { value: 'range', label: 'Date\u00A0range' }
                        ]}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={2} justifyItems={'stretch'} sx={{mb: 2}}>
                <Grid item>
                    <DatePicker
                        slotProps={{
                            textField: {error: errorFieldMapping.startDate}
                        }}
                        label={searchType == 'single' ? "Date" : "From"}
                        sx={{backgroundColor: '#fff', marginRight: '10px'}}
                        value={forecastDates.start}
                        onChange={(newValue: Moment | null) => handleDateChange('start', newValue || moment())}/>
                </Grid>
                {searchType === 'range' &&
                    <Grid item>
                        <DatePicker
                            slotProps={{
                                textField: {error: errorFieldMapping.endDate}
                            }}
                            label="To"
                            sx={{backgroundColor: '#fff'}}
                            value={forecastDates.end}
                            onChange={(newValue: Moment | null) => handleDateChange('end', newValue || moment())}/>
                    </Grid>
                }
            </Grid>
            <Grid container spacing={2} justifyItems={'stretch'} sx={{mb: 2}}>
                <Grid item xs={12}>
                    <Radios
                        name="comparisonType"
                        label="Select comparison date for historical arrivals (from Border Crossings)"
                        inline
                        small
                        value={comparisonType}
                        onChange={handleComparisonTypeChange}
                        options={[
                            { value: 'previousYear', label: 'Previous\u00A0Year' },
                            { value: 'custom', label: searchType == 'single' ? "Custom\u00A0date" : "Custom\u00A0date\u00A0range" }
                        ]}
                    />
                </Grid>

            </Grid>
            {comparisonType === 'custom' &&
                <Grid container spacing={2} justifyItems={'stretch'} sx={{mb: 2}}>
                    <Grid item>
                        <DatePicker
                            slotProps={{
                                textField: {error: errorFieldMapping.startDate}
                            }}
                            label={searchType == 'single' ? "Date" : "From"}
                            sx={{backgroundColor: '#fff', marginRight: '10px'}}
                            value={historicDates.start}
                            onChange={(newValue: Moment | null) => handleComparisonDateChange('start', newValue || moment())}/>
                    </Grid>
                    {searchType === 'range' && <Grid item>
                        <DatePicker
                            disabled={true}
                            slotProps={{
                                textField: {error: errorFieldMapping.endDate}
                            }}
                            label="To"
                            sx={{backgroundColor: '#fff'}}
                            value={historicDates.end}/>
                    </Grid>}
                </Grid>
            }
        </>
    )
}

const mapDispatch = (dispatch: MapDispatchToProps<any, RegionalPressureFormProps>) => {
    return {
        requestRegion: (
            userPorts: string[],
            availablePorts: string[],
            singleOrRange: 'single' | 'range',
            initialComparisonType: 'previousYear' | 'custom',
            startDate: string,
            endDate: string,
            isExport: boolean,
            historicStart: string,
            historicEnd: string,
        ) => {
            dispatch(requestPaxTotals(userPorts, availablePorts, singleOrRange, initialComparisonType, startDate, endDate, isExport, historicStart, historicEnd))
        }
    }
}

const mapState = (state: RootState) => {
    return {
        errors: state.pressureDashboard?.errors,
        singleOrRange: state.pressureDashboard?.singleOrRange,
        initialComparisonType: state.pressureDashboard?.comparisonType,
        forecastStart: state.pressureDashboard?.forecastStart,
        forecastEnd: state.pressureDashboard?.forecastEnd,
        historicStart: state.pressureDashboard?.historicStart,
        historicEnd: state.pressureDashboard?.historicEnd,
        status: state.pressureDashboard?.status,
    }
}

export default connect(mapState, mapDispatch)(RegionalPressureForm)
