import React, {useState} from 'react'
import {Box, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Breadcrumbs} from "@mui/material"
import {Button as DrtButton, ConfirmationDialog} from "@drt/drt-react"
import {ScheduledHealthCheckPause} from "./model"
import moment from "moment-timezone"
import Loading from "../Loading"
import {deleteHealthCheckPause, saveHealthCheckPauses, useHealthCheckPauses} from "../../store/heathCheckPauses"
import Typography from "@mui/material/Typography"
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker"
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment"
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {Moment} from "moment"
import {DataGrid} from "@mui/x-data-grid"
import {Alert} from "@mui/lab"
import {Link} from "react-router-dom"
import {enqueueSnackbar} from "notistack";
import {Helmet} from "react-helmet";
import {adminPageTitleSuffix} from "../../utils/common";
import PageContentWrapper from '../PageContentWrapper';

type ConfirmOpen = {
  kind: 'open'
  message: string
  onConfirm: () => void
}
type ConfirmClosed = {
  kind: 'closed'
}

type Confirm = ConfirmOpen | ConfirmClosed


export const HealthCheckEditor = () => {
  const [requestRefreshAt, setRequestRefreshAt] = useState<Moment>(moment())
  const {healthCheckPauses, loading, failed} = useHealthCheckPauses(requestRefreshAt.valueOf())
  const [newPause, setNewPause] = useState<ScheduledHealthCheckPause | null>(null)
  const [confirm, setConfirm] = useState<Confirm>({kind: 'closed'})
  const [newPauseIsValid, setNewPauseIsValid] = useState<boolean>(true)

  moment.locale('en-gb')

  const columns = [
    {
      field: 'pause',
      headerName: 'Pause',
      valueGetter: (params: any) => {
        const sameStartDate = moment(params.row.startsAt).isSame(moment(params.row.endsAt), 'day')
        return sameStartDate ?
          `${moment(params.row.startsAt).format("HH:mm")} to ${moment(params.row.endsAt).format("HH:mm, Do MMM YYYY")}` :
          `${moment(params.row.startsAt).format("HH:mm, Do MMM YYYY")} to ${moment(params.row.endsAt).format("HH:mm, Do MMM YYYY")}`
      },
      width: 400
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      valueGetter: (params: any) => moment(params.row.createdAt).format("HH:mm, Do MMM YYYY"),
      width: 200
    },
    {
      field: 'delete',
      headerName: '',
      width: 200,
      align: 'center' as const,
      renderCell: (params: any) =>
        <Box sx={{display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
          <DrtButton className="health-check-pause-remove-button" variant="secondary" onClick={() => setConfirm({
            kind: 'open',
            message: 'Are you sure you want to remove this health check pause?',
            onConfirm: confirmDeletePause(params.row.startsAt, params.row.endsAt),
          })}>
            Remove
          </DrtButton>
        </Box>
    },
  ]


  const today: () => Moment = () => moment()

  function addNewPause() {
    const now = today()
    const monthOfTheYear = now.month() + 1
    const str = `${now.year()}-${monthOfTheYear.toString().padStart(2, '0')}-${now.date().toString().padStart(2, '0')}T${now.hour() + 1}:00:00.000Z`
    const nextHour = moment(str)
    console.log(`str: ${str}, nextHour: ${nextHour.format()}`)
    setNewPause({
      startsAt: nextHour.valueOf(),
      endsAt: nextHour.add(1, 'hour').valueOf(),
      ports: [],
      createdAt: now.valueOf(),
    })
  }

  const setStart: (e: Moment | null) => void = e => {
    if (newPause && e) {
      const pause = {...newPause, startsAt: e.valueOf()}
      setNewPause(pause)
      validate(pause)
    }
  }

  const setEnd: (e: Moment | null) => void = e => {
    if (newPause && e) {
      const pause = {...newPause, endsAt: e.valueOf()}
      setNewPause(pause)
      validate(pause)
    }
  }

  const validate = (pause: ScheduledHealthCheckPause) => {
    setNewPauseIsValid(pause.startsAt < pause.endsAt)
  }

  const saveNewPause = (pause: ScheduledHealthCheckPause) => {
    console.log(`Saving new pause ${JSON.stringify(pause)}`)
    saveHealthCheckPauses({
      pause: pause,
      onSuccess: () => {
        console.log(`Saved new pause ${JSON.stringify(pause)}`)
        setNewPause(null)
        setRequestRefreshAt(moment())
      },
      onFailure: () => {
        console.log(`Failed to save new pause ${JSON.stringify(pause)}`)
        enqueueSnackbar("Sorry, I couldn't save the new pause. Please try again later.")
      }
    })
  }

  const deletePause = (from: number, to: number) => {
    console.log(`Deleting pause ${from} to ${to}`)
    deleteHealthCheckPause({
      startsAt: from,
      endsAt: to,
      onSuccess: () => {
        console.log(`Deleted pause ${from} to ${to}`)
        setRequestRefreshAt(moment())
      },
      onFailure: () => {
        console.log(`Failed to delete pause ${from} to ${to}`)
        enqueueSnackbar("Sorry, I couldn't delete the pause. Please try again later.")
      }
    })
  }

  const confirmDeletePause = (from: number, to: number) => () => {
    setConfirm({kind: 'closed'})
    deletePause(from, to)
  }

  const rows = [...healthCheckPauses]
    .sort((a, b) => -1 * (b.startsAt.valueOf() - a.startsAt.valueOf()))

  return <PageContentWrapper>
    <Helmet>
      <title>Health Check Pauses {adminPageTitleSuffix}</title>
    </Helmet>
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale={'en-gb'}>
      <Stack gap={4} alignItems={'left'} sx={{my: 2}}>
        <Breadcrumbs>
          <Link to={"/"}>
            Home
          </Link>
          <Typography color="text.primary">Health check pauses</Typography>
        </Breadcrumbs>
        <DrtButton className="health-check-pause-add-button" variant="primary" onClick={addNewPause}>Add a new pause</DrtButton>
        <>
          {newPause &&
            <Dialog open={true} maxWidth="xs">
              <DialogTitle>
                Add a pause
              </DialogTitle>
              <DialogContent sx={{minWidth: 380}}>
                <Stack sx={{my: 2, gap: 2}}>
                  {!newPauseIsValid && <Alert severity="error">The start time must be before the end time</Alert>}
                  <DateTimePicker
                    slotProps={{textField: {variant: 'outlined'}}}
                    value={moment(newPause.startsAt)}
                    label={'From'}
                    onChange={setStart}/>
                  <DateTimePicker
                    slotProps={{textField: {variant: 'outlined'}}}
                    value={moment(newPause.endsAt)}
                    label={'To'}
                    onChange={setEnd}
                  />
                </Stack>
              </DialogContent>
              <DialogActions sx={{justifyContent: 'center', m: 0, p: 0}}>
                <Box sx={{
                  display: 'flex',
                  width: 'calc(100% - 48px)',
                  boxSizing: 'border-box',
                  justifyContent: 'flex-end',
                  gap: 1,
                  m: 0,
                  p: 0,
                }}>
                  <DrtButton variant="primary"
                          onClick={() => newPause && saveNewPause(newPause)}
                          disabled={!newPauseIsValid}>
                    Save
                  </DrtButton>
                  <DrtButton variant="secondary" onClick={() => setNewPause(null)}>
                    Cancel
                  </DrtButton>
                </Box>
              </DialogActions>
            </Dialog>}
          {confirm.kind === 'open' &&
            <ConfirmationDialog
              isOpen={true}
              title="Confirm remove health check pause"
              confirmVariant="warning"
              onCancel={() => setConfirm({kind: 'closed'})}
              onConfirm={confirm.onConfirm}
            >
              <p>{confirm.message}</p>
            </ConfirmationDialog>}
          {loading ?
            <Loading/> :
            failed ?
              <Typography variant={'body1'}>Sorry, I couldn't load the existing pauses</Typography> :
              healthCheckPauses.length === 0 ?
                <Typography variant={'body1'}>There are no current or upcoming pauses</Typography> :
                <Box sx={{height: 400, width: '100%'}}>
                  <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(r) => r.createdAt.valueOf().toString()}
                    disableRowSelectionOnClick={true}
                  />
                </Box>
          }
        </>
      </Stack>
    </LocalizationProvider>
  </PageContentWrapper>
}
