import React, {useEffect, useState} from "react";
import {Button, Snackbar} from "@mui/material";
import axios, {AxiosResponse} from "axios";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import Box from "@mui/material/Box";
import moment from 'moment';
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import {jsonSeminarData} from "./CreateSeminar";
import {Alert} from "./DialogActionComponent";
import {useParams} from 'react-router-dom';
import {Redirect} from 'react-router-dom';

export function EditSeminar() {
    const [redirectTo, setRedirectTo] = useState(null);
    const {seminarId} = useParams<{ seminarId: string }>();
    const [editTitle, setEditTitle] = React.useState()
    const [editStartTime, setEditStartTime] = React.useState();
    const [editEndTime, setEditEndTime] = React.useState();
    const [editMeetingLink, setEditMeetingLink] = React.useState();
    const [updated, setUpdated] = useState(false);
    const [error, setError] = useState(false);

    const handleClose = () => {
        setError(false);
        setRedirectTo('/seminars/list');
    };


    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setEditTitle(response.data.title)
            setEditStartTime(moment(response.data.startTime))
            setEditEndTime(moment(response.data.endTime))
            setEditMeetingLink(response.data.meetingLink)
        } else {
            setError(true);
        }
    }

    const handleUpdateResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setUpdated(true);
            response.data
        } else {
            setError(true);
            response.data
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        axios.put('/seminar/update/' + seminarId,
            jsonSeminarData(editStartTime, editEndTime, editTitle || '', editMeetingLink || ''))
            .then(response => handleUpdateResponse(response))
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                setError(true);
                console.error(error);
            });
    };

    useEffect(() => {
        axios.get('/seminar/get/' + seminarId)
            .then(response => handleResponse(response))
            .then(data => {
                console.log(data);
            }).catch(error => {
            setError(true);
            console.error(error);
        });
    }, [seminarId]);

    return (
        <div>
            {redirectTo && <Redirect to={redirectTo}/>}
            {<div>
                <h1>Edit Seminar | {redirectTo} </h1>
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
                    open={updated}
                    autoHideDuration={6000}
                    onClose={() => handleClose()}>
                    <Alert onClose={() => handleClose()} severity="success" sx={{width: '100%'}}>
                        Seminar updated successfully ! Please check the seminar list.
                    </Alert>
                </Snackbar>
                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={2}>
                            <label>Seminar Title:</label></Grid>
                        <Grid item xs={10}>
                            <TextField label="Title" type="text" value={editTitle}
                                       onChange={(e) => setEditTitle(e.target.value)}/>
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
                                placeholder="Paste your meeting link here"
                                value={editMeetingLink}
                                onChange={(e) => setEditMeetingLink(e.target.value)}/>
                        </Grid>
                        <Grid item xs={3}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DateTimePicker
                                    renderInput={(props) => <TextField {...props} />}
                                    label="Start Time"
                                    value={editStartTime}
                                    onChange={(newValue) => {
                                        setEditStartTime(newValue);
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={9}>
                            <LocalizationProvider dateAdapter={AdapterMoment}>
                                <DateTimePicker
                                    renderInput={(props) => <TextField {...props} />}
                                    label="End Time"
                                    value={editEndTime}
                                    onChange={(newValue) => {
                                        setEditEndTime(newValue);
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{paddingLeft: "20%"}}>
                                <Button variant="outlined" type="submit">Update</Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </div>}</div>
    )
}
