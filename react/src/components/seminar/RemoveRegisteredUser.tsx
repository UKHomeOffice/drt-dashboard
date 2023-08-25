import React, {useState} from "react";
import axios, {AxiosResponse} from "axios";
import {Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import Button from "@mui/material/Button";

interface Props {
    id: string | undefined;
    email: string | undefined;
    showUnregistered: boolean;
    setShowUnregistered: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    setReceivedData: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export function RemoveRegisteredUser(props: Props) {
    const [error, setError] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setConfirmDelete(true);
            console.log('Deleted Feature Guide');
        } else {
            setError(true);
            response.data
        }
    }

    const handleErrorDialogClose = () => {
        setError(false);
        props.setShowUnregistered(false);
    }

    const handleCloseConfirmDialog = () => {
        setConfirmDelete(false);
        props.setShowUnregistered(false);
        props.setReceivedData(false);
    }

    const handleConfirmDialog = () => {
        confirmFeatureDelete();
    }

    const confirmFeatureDelete = () => {
        axios.delete('/seminar-register/remove/' + props.id + '/' + props.email)
            .then(response => handleResponse(response))
    }
    return (
        error ?
            <Dialog open={error} onClose={handleErrorDialogClose}>
                <DialogTitle>Error</DialogTitle>
                <DialogContent>
                    <p>Error while deleting</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleErrorDialogClose}>Close</Button>
                </DialogActions>
            </Dialog> :
            confirmDelete ?
                <Dialog open={confirmDelete} onClose={handleCloseConfirmDialog}>
                    <DialogTitle>User removed</DialogTitle>
                    <DialogContent>
                        <p>User requested is unregistered</p>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseConfirmDialog}>Close</Button>
                    </DialogActions>
                </Dialog> :
                <Dialog open={props.showUnregistered} onClose={handleCloseConfirmDialog}>
                    <DialogTitle>Confirm Removal</DialogTitle>
                    <DialogContent>
                        <p>Are you sure you want to remove the user?</p>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
                        <Button onClick={handleConfirmDialog} variant="contained" color="error">
                            Unregister
                        </Button>
                    </DialogActions>
                </Dialog>
    )
}
