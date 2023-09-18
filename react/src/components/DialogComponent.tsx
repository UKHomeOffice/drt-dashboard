import React from "react";
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
    displayText: string;
    showDialog: boolean;
    setShowDialog: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    error: boolean;
    setError: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    confirmAction: boolean;
    setConfirmAction: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export function DialogComponent(props: Props) {

    const handleErrorDialogClose = () => {
        props.setError(false);
        props.setConfirmAction(false);
    }

    const handleCloseConfirmDialog = () => {
        props.setShowDialog(false);
        props.setConfirmAction(false);
    }

    const handleConfirmDialog = () => {
        props.setConfirmAction(true);
    }


    return (
        <div>
            <Snackbar
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                open={props.error}
                autoHideDuration={6000}
                onClose={() => handleErrorDialogClose}>
                <Alert onClose={handleErrorDialogClose} severity="error" sx={{width: '100%'}}>
                    Error while {props.displayText} !
                </Alert>
            </Snackbar>
            <Snackbar
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                open={props.confirmAction}
                autoHideDuration={6000}
                onClose={() => handleCloseConfirmDialog}>
                <Alert onClose={handleCloseConfirmDialog} severity="success" sx={{width: '100%'}}>
                    Requested is {props.displayText} !
                </Alert>
            </Snackbar>
            <Dialog open={props.showDialog} onClose={handleCloseConfirmDialog}>
                <DialogTitle>Confirm {props.displayText}</DialogTitle>
                <DialogContent>
                    <p>Are you sure you want to {props.displayText} this item?</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
                    <Button onClick={handleConfirmDialog} variant="contained" color="error">
                        {props.displayText}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>

    )
}
