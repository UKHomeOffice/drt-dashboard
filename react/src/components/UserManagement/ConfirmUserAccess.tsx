import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import ListItemText from "@mui/material/ListItemText";
import {ListItem} from "@mui/material";
import List from "@mui/material/List";

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
    emails: string[]
    message: string
    parentRequestPosted: boolean
    setParentRequestPosted: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    apiRequested: boolean
    setApiRequested: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    openModel: boolean
    setOpenModel: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export default function ConfirmUserAccess(props: IProps) {

    const email = () => {
        return props.emails.filter(e => e != undefined)
    }

    const resetRequestPosted = () => {
        props.setApiRequested(false)
        props.setParentRequestPosted(false)
        props.setOpenModel(false)
    }

    const logMessage = () => {
        console.log('emails' + props.emails + ' ' + props.emails.map(e => e + ' '))
    }

    const moreThanOneUserDisplay = () => {
        return <div>
            The following users have had their request {messageDisplay()}
            <List>
                {email().map(e =>
                    <ListItem>
                        <ListItemText
                            primary={e}
                        />
                    </ListItem>,
                )}
            </List>
        </div>
    }

    const singleUserDisplay = () => {
        return <div>
            {email()} has had their request {messageDisplay()}
        </div>
    }

    const messageDisplay = () => {
        switch (props.message.toLowerCase()) {
            case "granted" :
                return "Approved"
            case "revert" :
                return "Reverted"
            default :
                return "Dismissed"
        }
    }

    return (
        <div className="flex-container">
            <div>
                <Box sx={style}>
                    <Typography align="center" id="modal-modal-title" variant="h6" component="h2">
                        User {messageDisplay()}
                        {logMessage}
                    </Typography>
                    <br/>
                    {email().length > 1 ? moreThanOneUserDisplay() : singleUserDisplay()}
                    <Button style={{float: 'right'}} onClick={resetRequestPosted}>back</Button>
                </Box>
            </div>
        </div>
    );
}
