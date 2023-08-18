import React, {useState} from 'react';
import axios, {AxiosResponse} from "axios";
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {DateTimePicker} from '@mui/x-date-pickers/DateTimePicker';
import TextField from '@mui/material/TextField';
import {AdapterDayjs} from "@mui/x-date-pickers/AdapterDayjs";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import {Dayjs} from 'dayjs';
import {ListSeminar} from "./ListSeminar";


export function CreateSeminar() {
    const [error, setError] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [startTime, setStartTime] = React.useState<Dayjs | null>(null);
    const [endTime, setEndTime] = React.useState<Dayjs | null>(null);
    const [saved, setSaved] = useState(false);
    const [viewSeminars, setViewSeminars] = useState(false);


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
        const startTimeString = startTime?.format("YYYY-MM-DDTHH:mm") as string
        const endTimeString = endTime?.format("YYYY-MM-DDTHH:mm") as string
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('startTime', startTimeString);
        formData.append('endTime', endTimeString);
        axios.post('/seminar/save', formData)
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
                <h1>Create Seminar</h1>
                <div style={{marginTop: '20px', color: 'red'}}> There was a problem saving the seminar guide</div>
                <Button variant="outlined" color="primary" style={{marginTop: '20px'}}
                        onClick={() => setError(false)}>Back</Button>
            </div> :
            saved ?
                <div>
                    <h1>Create Seminar</h1>
                    <div style={{marginTop: '20px', color: 'green'}}>Seminar saved successfully</div>
                    <Button variant="outlined" color="primary" style={{marginTop: '20px'}}
                            onClick={() => setSaved(false)}>Back</Button>
                </div> :
                viewSeminars ? <ListSeminar setViewSeminars={setViewSeminars}/> :
                    <Box>
                        <h1>Create Seminar | <a href="#" style={{marginTop: '20px'}}
                                                onClick={() => setViewSeminars(true)}>View Seminars</a></h1>
                        <form onSubmit={handleSubmit}>
                            <Grid container spacing={3} alignItems="center">
                                <Grid item xs={2}>
                                    <label>Seminar Title:</label></Grid>
                                <Grid item xs={10}>
                                    <TextField required label="Title" type="text" value={title}
                                               onChange={(e) => setTitle(e.target.value)}/>
                                </Grid>
                                <Grid item xs={2}>
                                    <label>Description:</label>
                                </Grid>
                                <Grid item xs={10}>
                                    <TextField required
                                               fullWidth
                                               label="Description"
                                               sx={{width: 400}}
                                               multiline
                                               rows={2}
                                               variant="outlined"
                                               placeholder="Describe your seminar here"
                                               value={description}
                                               onChange={(e) => setDescription(e.target.value)}/>
                                </Grid>
                                <Grid item xs={3}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DateTimePicker
                                            renderInput={(props) => <TextField required {...props} />}
                                            label="Start Time"
                                            value={startTime}
                                            onChange={(newValue) => {
                                                setStartTime(newValue);
                                            }}

                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid item xs={9}>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
