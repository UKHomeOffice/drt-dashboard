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
    const [error, setError] = useState(false);
    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = React.useState();
    const [endTime, setEndTime] = React.useState();
    const [saved, setSaved] = useState(false);
    const [meetingLink, setMeetingLink] = useState('');

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
        error ?
            <div>
                <div style={{marginTop: '20px', color: 'red'}}> There was a problem saving the seminar guide</div>
                <Button variant="outlined" color="primary" style={{marginTop: '20px'}}
                        onClick={() => setError(false)}>Back</Button>
            </div> :
            saved ?
                <div>
                    <div style={{marginTop: '20px', color: 'green'}}>Seminar saved successfully</div>
                    <Button variant="outlined" color="primary" style={{marginTop: '20px'}}
                            onClick={() => setSaved(false)}>Back</Button>
                </div> :
                <Box>
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
    )
}
