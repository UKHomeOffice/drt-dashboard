import React, {useState} from 'react';
import axios, {AxiosResponse} from "axios";
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker';
import TextField from '@mui/material/TextField';
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import moment from 'moment-timezone';
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import {Moment} from "moment";
import {Snackbar} from "@mui/material";
import {Alert} from "../DialogComponent";
import {Redirect} from "react-router-dom";

export function jsonSeminarData(startTime: Moment | undefined, endTime: Moment | undefined, title: string, meetingLink: string) {
    const startTimeString = startTime?.format()
    const endTimeString = endTime?.format()
    return {
        'title': title,
        'startTime': startTimeString,
        'endTime': endTimeString,
        'meetingLink': meetingLink
    }
}

export function CreateSeminar() {
    moment.tz.setDefault('Europe/London');
    const [redirectTo, setRedirectTo] = useState(null);
    const [error, setError] = useState(false);
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = React.useState();
    const [endTime, setEndTime] = React.useState();
    const [saved, setSaved] = useState(false);
    const [meetingLink, setMeetingLink] = useState('');

    const handleClose = () => {
        setError(false);
        setRedirectTo('/seminars/list');
    };

    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setSaved(true);
            response.data
        } else {
            setError(true);
            response.data
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        axios.post('/seminar/save', jsonSeminarData(startTime, endTime, title, meetingLink))
            .then(response => handleResponse(response))
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                setError(true);
                console.error(error);
            });
    };

    return (
        <div>
            {redirectTo && <Redirect to={redirectTo}/>}
            <Box>
                <h1>Create Seminar</h1>
                <Snackbar
                    anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                    open={error}
                    autoHideDuration={6000}
                    onClose={() => setError(false)}>
                    <Alert onClose={() => setError(false)} severity="error" sx={{width: '100%'}}>
                        There was a problem saving the seminar guide.
                    </Alert>
                </Snackbar>
                <Snackbar
                    anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                    open={saved}
                    autoHideDuration={6000}
                    onClose={() => handleClose()}>
                    <Alert onClose={() => handleClose()} severity="success" sx={{width: '100%'}}>
                        Seminar saved successfully ! Please check the seminar list.
                    </Alert>
                </Snackbar>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={2}>
                            <label>Seminar Title:</label></Grid>
                        <Grid item xs={10}>
                            <TextField required label="Title" type="text" value={title}
                                       onChange={(e) => setTitle(e.target.value)}/>
                        </Grid>
                        <Grid item xs={2}>
                            <label>Meeting Link:</label>
                        </Grid>
                        <Grid item xs={10}>
                            <TextField
                                fullWidth
                                label="Meeting Link"
                                sx={{width: 400}}
                                multiline
                                rows={1}
                                variant="outlined"
                                placeholder="Copy and paste your meeting link here"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}/>
                        </Grid>
                        <Grid item xs={3}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DateTimePicker
                                    renderInput={(props) => <TextField required {...props} />}
                                    label="Start Time"
                                    value={startTime}
                                    onChange={(newValue) => {
                                        setStartTime(newValue);
                                        setEndTime(newValue);
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={9}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DateTimePicker
                                    renderInput={(props) => <TextField required {...props} />}
                                    label="End Time"
                                    value={endTime}
                                    onChange={(newValue) => {
                                        setEndTime(newValue);
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{paddingLeft: "20%"}}>
                                <Button variant="outlined" type="submit">Submit</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Box>
        </div>
    )
}
