import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

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
    email: string | undefined
    message: string
}

export default function ConfirmUserAccess(props: IProps) {

    const resetRequestPosted = () => {
        window.location.reload();
    }

    return (
        <div className="flex-container">
            <div>
                <Box sx={style}>
                    <Typography align="center" id="modal-modal-title" variant="h6" component="h2">
                        User {props.message == 'granted' ? "Approved" : "Dismissed"}
                    </Typography>
                    <br/>
                    <div>Selected User with email {props.email} is {props.message} access requested.
                    </div>
                    <Button style={{float: 'right'}} onClick={resetRequestPosted}>back</Button>
                </Box>
            </div>
        </div>
    );
}
