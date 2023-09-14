import React, {useState} from "react";
import {Button} from "@mui/material";
import axios, {AxiosResponse} from "axios";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import Box from "@mui/material/Box";
import moment from 'moment';
import {AdapterMoment} from "@mui/x-date-pickers/AdapterMoment";
import {jsonSeminarData} from "./CreateSeminar";

interface Props {
    id: string | undefined;
    title: string | undefined;
    startTime: string | undefined;
    endTime: string | undefined;
    meetingLink: string | undefined;
    showEdit: boolean;
    setShowEdit: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export function EditSeminar(props: Props) {
    const [editTitle, setEditTitle] = React.useState(props.title)
    const [editStartTime, setEditStartTime] = React.useState(moment(props.startTime));
    const [editEndTime, setEditEndTime] = React.useState(moment(props.endTime));
    const [editMeetingLink, setEditMeetingLink] = React.useState(props.meetingLink);
    const [updated, setUpdated] = useState(false);
    const [error, setError] = useState(false);

    const handleBack = () => {
        props.setShowEdit(false);
    }

    const handleBackToList = () => {
        props.setShowEdit(false);
    }

    const handleResponse = (response: AxiosResponse) => {
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
        axios.put('/seminar/edit/' + props.id,
            jsonSeminarData(editStartTime, editEndTime, editTitle || '', editMeetingLink || ''))
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
        error ? <div>
                <div style={{marginTop: '20px', color: 'red'}}>
                    <div>There was a problem saving the feature guide</div>
                    <Button variant="outlined" color="primary" style={{marginTop: '20px'}}
                            onClick={() => setError(false)}>Back</Button>
                </div>
            </div> :
            updated ?
                <div>
                    <div style={{marginTop: '20px', color: 'green'}}>Seminar updated</div>
                    <Button variant="outlined" color="primary" style={{marginTop: '20px'}}
                            onClick={handleBackToList}>Another Seminar update</Button></div> :
                <div>
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
                    <Button style={{float: 'right'}} variant="outlined"
                            color="primary"
                            onClick={handleBack}>back</Button>
                </div>
    )
}
