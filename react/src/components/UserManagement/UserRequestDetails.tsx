import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

interface UserRequestedAccessData {
    agreeDeclaration: boolean;
    allPorts: boolean;
    email: string;
    lineManager: string;
    portOrRegionText: string;
    portsRequested: string;
    rccOption: boolean;
    regionsRequested: string;
    requestTime: string;
    staffText: string;
    staffing: boolean;
    status: string
}

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
    openModal: boolean;
    setOpenModal: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    rowDetails: UserRequestedAccessData
}

export default function UserRequestDetails(props: IProps) {
    const [open, setOpen] = React.useState(true);
//     const handleOpen = () => setOpen(true);
    const handleClose = () => {
        props.setOpenModal(false)
        setOpen(false)
    }

    return (
        <div class="flex-container">
            <div>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description">
                    <Box sx={style}>
                        <Typography align="center" id="modal-modal-title" variant="h6" component="h2">
                            User Request Details
                        </Typography>
                        <TableContainer component={Paper}>
                            <Table sx={{minWidth: 500}} size="small" aria-label="a dense table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{minWidth: 150}}>User Information</TableCell>
                                        <TableCell>User data</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Email</TableCell>
                                        <TableCell>{props.rowDetails.email}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Line Manager</TableCell>
                                        <TableCell>{props.rowDetails.lineManager}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>All ports requested</TableCell>
                                        <TableCell>{props.rowDetails.allPorts}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Time Requested</TableCell>
                                        <TableCell>{props.rowDetails.requestTime}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Ports Request</TableCell>
                                        <TableCell>{props.rowDetails.portsRequested}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Regions Request</TableCell>
                                        <TableCell>{props.rowDetails.regionsRequested}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Staffing Requested</TableCell>
                                        <TableCell>{props.rowDetails.staffing}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Ports / Region Request reason</TableCell>
                                        <TableCell>{props.rowDetails.portOrRegionText}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Staffing Reason</TableCell>
                                        <TableCell>{props.rowDetails.staffText}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Rcc request</TableCell>
                                        <TableCell>{props.rowDetails.rccOption}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Request Status</TableCell>
                                        <TableCell>{props.rowDetails.status}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Agree Declaration</TableCell>
                                        <TableCell>{props.rowDetails.agreeDeclaration}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <Button style={{float: 'right'}} onClick={handleClose}>Close</Button>
                    </Box>
                </Modal>
            </div>
        </div>
    );
}
