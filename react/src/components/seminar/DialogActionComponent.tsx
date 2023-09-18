import React, {useEffect, useState} from "react";
import axios, {AxiosResponse} from "axios";
import {DialogComponent} from "../DialogComponent";

interface Props {
    showDialog: boolean;
    setShowDialog: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    actionUrl: string;
    actionString: string;
    actionMethod: string;
}

export function DialogActionComponent(props: Props) {
    const [error, setError] = useState(false);
    const [confirmAction, setConfirmAction] = useState(false);
    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            props.setShowDialog(false);
            console.log(props.actionString + ' Seminar data');
        } else {
            setError(true);
            response.data
        }
    }

    useEffect(() => {
        handleConfirmDialog();
    }, [confirmAction]);

    const handleConfirmDialog = () => {
        if (confirmAction) {
            if (props.actionMethod == "DELETE")
                executeDeleteAction();
            else
                executePostAction();
        }

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
            <DialogComponent displayText={props.actionString}
                             showDialog={props.showDialog}
                             setShowDialog={props.setShowDialog}
                             error={error}
                             setError={setError}
                             confirmAction={confirmAction}
                             setConfirmAction={setConfirmAction}/>
        </div>

    )
}
