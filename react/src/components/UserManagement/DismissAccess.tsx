import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import {UserRequestedAccessData} from "./UserRequestDetails";
import axios from "axios";
import ApiClient from "../../services/ApiClient";
import ConfirmUserAccess from "./ConfirmUserAccess";

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

interface IProps {
    openDismissModal: boolean;
    setOpenDismissModal: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    rowDetails: UserRequestedAccessData[]
}

//TODO: remove this if modal is not needed for dismiss for text reason
export default function DismissAccess(props: IProps) {
    const [open, setOpen] = React.useState(true);
    // const [userDetails, setUserDetails] = React.useState({});
    // const [apiRequestCount, setApiRequestCount] = React.useState(0);
    const [requestPosted, setRequestPosted] = React.useState(false)

    const handleClose = () => {
        props.setOpenDismissModal(false)
        setOpen(false)
    }

    const dismissUserRequest = () => {
        props.rowDetails.map(rowDetail => axios.post(ApiClient.dismissUserRequestEndpoint, rowDetail)
            .then(response => console.log('dismiss user' + response.data))
            .then(() => setRequestPosted(true)))
    }

    const showApprovedOrAccessRequest = () => {
        return requestPosted ?
            <ConfirmUserAccess message={"dismissed"}
                               emails={props.rowDetails.map(rd => rd.email)}/> : showDismissedRequest()
    }

    const showDismissedRequest = () => {
        return <div>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description">
                <Box sx={style}>
                    <Typography align="center" id="modal-modal-title" variant="h6" component="h2">
                        Dismiss User request
                    </Typography>
                    <TextField style={{width: "100%"}} id="outlined-basic" label="Dismiss reason" variant="outlined"/>
                    <Grid container>
                        <Grid xs={8}>
                            <Button style={{float: 'initial'}} onClick={dismissUserRequest}>Dismiss</Button>
                        </Grid>
                        <Grid xs={4}>
                            <Button style={{float: 'right'}} onClick={handleClose}>Close</Button>
                        </Grid>
                    </Grid>
                </Box>
            </Modal>
        </div>
    }

    return (showApprovedOrAccessRequest())
}
