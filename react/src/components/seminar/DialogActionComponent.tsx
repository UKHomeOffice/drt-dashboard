import React, {useState} from "react";
import axios, {AxiosResponse} from "axios";
import {Dialog, DialogActions, DialogContent, DialogTitle, Snackbar} from "@mui/material";
import Button from "@mui/material/Button";

import MuiAlert, {AlertProps} from '@mui/material/Alert';

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
    props,
    ref,
) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});


interface Props {
    id: string | undefined;
    showDialog: boolean;
    actionUrl: string;
    actionString: string;
    actionMethod: string;
    setShowDialog: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export function DialogActionComponent(props: Props) {
    const [error, setError] = useState(false);
    const [confirmAction, setConfirmAction] = useState(false);
    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setConfirmAction(true);
            props.setShowDialog(false);
            console.log(props.actionString + ' Seminar data');
        } else {
            setError(true);
            response.data
        }
    }

    const handleErrorDialogClose = () => {
        setError(false);
        props.setShowDialog(false);
    }

    const handleCloseConfirmDialog = () => {
        setConfirmAction(false);
        props.setShowDialog(false);
        // props.setReceivedData(false);
    }

    const handleConfirmDialog = () => {
        if (props.actionMethod === 'DELETE')
            executeDeleteAction();
        else
            executePostAction();
    }

    const executePostAction = () => {
        axios.post(props.actionUrl, {published: props.actionString == "publish"})
            .then(response => handleResponse(response))

    }

    const executeDeleteAction = () => {
        axios.delete(props.actionUrl)
            .then(response => handleResponse(response))
    }
    return (
        <div>
            <Snackbar
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                open={error}
                autoHideDuration={6000}
                onClose={() => handleErrorDialogClose}>
                <Alert onClose={handleErrorDialogClose} severity="error" sx={{width: '100%'}}>
                    Error while {props.actionString} !
                </Alert>
            </Snackbar>
            <Snackbar
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                open={confirmAction}
                autoHideDuration={6000}
                onClose={() => handleCloseConfirmDialog}>
                <Alert onClose={handleCloseConfirmDialog} severity="success" sx={{width: '100%'}}>
                    Seminar requested is {props.actionString} !
                </Alert>
            </Snackbar>
            <Dialog open={props.showDialog} onClose={handleCloseConfirmDialog}>
                <DialogTitle>Confirm {props.actionString}</DialogTitle>
                <DialogContent>
                    <p>Are you sure you want to {props.actionString} this item?</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDialog} variant="contained" color="error">
                        {props.actionString}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>

    )
}
