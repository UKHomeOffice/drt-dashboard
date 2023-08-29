import React, {useState} from "react";
import {Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {DeleteSeminar} from "./DeleteSeminar";
import Typography from "@mui/material/Typography";

interface Props {
    id: string | undefined;
    title: string | undefined;
    description: string | undefined;
    startTime: string | undefined;
    endTime: string | undefined;
    meetingLink: string | undefined;
    view: boolean;
    setView: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    setReceivedData: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    showEdit: boolean;
    setShowEdit: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    isEdit: boolean;
}

export function ViewSeminar(props: Props) {
    const [showDelete, setShowDelete] = useState(false);

    const handleEdit = () => {
        props.setShowEdit(true);
        props.setView(false)
    }

    const handleViewClose = () => {
        props.setView(false)
    }

    const handleDelete = () => {
        props.setView(false)
        setShowDelete(true);
    }

    return (
        showDelete ? <DeleteSeminar id={props.id} showDelete={showDelete} setShowDelete={setShowDelete}
                                    setReceivedData={props.setReceivedData}/> :
            <Dialog open={props.view} maxWidth="sm" onClose={handleViewClose}>
                <Grid container spacing={2}>
                    <Grid item xs={8}>
                        <DialogTitle sx={{
                            "color": "#233E82",
                            "backgroundColor": "#E6E9F1",
                            "font-size": "30px",
                            "font-weight": "bold",
                        }}>
                            Seminar View
                        </DialogTitle>
                    </Grid>
                    <Grid item xs={4} sx={{"backgroundColor": "#E6E9F1"}}>
                        <DialogActions>
                            {props.isEdit ? <div>
                                <IconButton aria-label="delete" onClick={handleDelete}><DeleteIcon/></IconButton>
                                <IconButton aria-label="edit" onClick={handleEdit}><EditIcon/></IconButton>
                            </div> : null}
                            <IconButton aria-label="close"
                                        onClick={handleViewClose}><CloseIcon/></IconButton>
                        </DialogActions>
                    </Grid>
                </Grid>
                <DialogContent sx={{
                    "backgroundColor": "#E6E9F1",
                    "padding-top": "0px",
                    "padding-left": "24px",
                    "padding-right": "24px",
                    "padding-bottom": "64px",
                    "overflow": "hidden"
                }}>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={3}>
                            <label>Seminar Title:</label></Grid>
                        <Grid item xs={9}>
                            <Typography>{props.title}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <label>Description:</label>
                        </Grid>
                        <Grid item xs={9}>
                            <Typography>{props.description}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <label>Start Time:</label>
                        </Grid>
                        <Grid item xs={9}>
                            <Typography>{props.startTime}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <label>End Time:</label>
                        </Grid>
                        <Grid item xs={9}>
                            <Typography>{props.endTime}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <label>Meeting Link:</label>
                        </Grid>
                        <Grid item xs={9}>
                            <Typography><a href={props.meetingLink}>Team link</a></Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
    )
}
