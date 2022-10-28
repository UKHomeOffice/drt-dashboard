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
}

export default function ConfirmUserAccess(props: IProps) {

    const resetRequestPosted = () => {
        window.location.reload();
    }
    const logMessage = () => {
        console.log('emails' + props.emails + ' ' + props.emails.map(e => e + ' '))
    }

    const moreThanOneUserDisplay = () => {
        return <div>
            Following selected users are {props.message} access requested.
            <List>
                {props.emails.filter(e => e != undefined).map(e =>
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
            Selected User with
            email {props.emails.filter(e => e != undefined).map(e => e ? e + ' ' : ' ')} is {props.message} access
            requested.
        </div>
    }

    return (
        <div className="flex-container">
            <div>
                <Box sx={style}>
                    <Typography align="center" id="modal-modal-title" variant="h6" component="h2">
                        User {props.message == 'granted' ? "Approved" : "Dismissed"}
                        {logMessage}
                    </Typography>
                    <br/>
                    {props.emails.filter(e => e != undefined).length > 1 ? moreThanOneUserDisplay() : singleUserDisplay()}
                    <Button style={{float: 'right'}} onClick={resetRequestPosted}>back</Button>
                </Box>
            </div>
        </div>
    );
}
