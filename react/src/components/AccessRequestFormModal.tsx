import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';

const style = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

interface IProps {
    rccOption: boolean;
    rccRegions: string[];
    ports: string[];
    manageStaff: boolean;
    portOrRegionText: string;
    setPortOrRegionText: ((value: (((prevState: string) => string) | string)) => void)
    staffText: string;
    setStaffText: ((value: (((prevState: string) => string) | string)) => void)
    saveCallback: () => void;
}

export default function AccessRequestFormModal(props: IProps) {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleEvent = () => {
        props.saveCallback();
    };

    const handlePortOrRegionTextChange = (event) => {
        console.log('props.setPortOrRegionText ' + event.target.value)
        props.setPortOrRegionText(event.target.value);
    };

    const handleStaffTextChange = (event) => {
        console.log('props.setStaffText ' + event.target.value)
        props.setStaffText(event.target.value);
    };

    return (
        <div class="flex-container">
            <div>
                <Button style={{float: 'center'}} variant="contained"
                        onClick={handleOpen}>More Info</Button>
            </div>
            <div>
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description">
                    <Box sx={style}>
                        <Typography align="center" id="modal-modal-title" variant="h6" component="h2">
                            More information about the request
                        </Typography>
                        <List sx={{width: '100%', bgcolor: 'background.paper'}}>
                            <ListItem alignItems="flex-start">
                                {(props.rccOption && props.rccRegions.length > 1) ?
                                    <Typography align="center" id="modal-modal-title">
                                        Please say why you have requested access to more than one region.
                                        <TextField style={{width: "100%"}}
                                                   id="outlined-basic"
                                                   label="Enter text"
                                                   variant="outlined"
                                                   value={props.portOrRegionText}
                                                   onChange={handlePortOrRegionTextChange}/>
                                    </Typography>
                                    : <span/>
                                }
                            </ListItem>
                            <ListItem alignItems="flex-start">
                                {(!props.rccOption && props.ports.length > 1) ?
                                    <Typography align="center" id="modal-modal-description" sx={{mt: 2}}>
                                        Please say why you have requested access to more than one port dashboard.
                                        <TextField style={{width: "100%"}} id="outlined-basic" label="Enter text"
                                                   variant="outlined" value={props.portOrRegionText}
                                                   onChange={handlePortOrRegionTextChange}
                                        />
                                    </Typography>
                                    : <span/>
                                }
                            </ListItem>
                            <ListItem alignItems="flex-start">
                                {(!props.rccOption && props.ports.length > 0 && props.manageStaff) ?
                                    <Typography align="center" id="modal-modal-description" sx={{mt: 2}}>
                                        Please say why you have requested permission to manage staff.
                                        <TextField style={{width: "100%"}} id="outlined-basic" label="Enter text"
                                                   variant="outlined" value={props.staffText}
                                                   onChange={handleStaffTextChange}/>
                                    </Typography>
                                    : <span/>
                                }
                            </ListItem>
                            <ListItem alignItems="flex-start">
                                {(props.rccOption && props.manageStaff) ?
                                    <Typography align="center" id="modal-modal-description" sx={{mt: 2}}>
                                        Please say why you have requested permission to manage staff.
                                        <TextField style={{width: "100%"}} id="outlined-basic" label="Enter text"
                                                   variant="outlined" value={props.staffText}
                                                   onChange={handleStaffTextChange}/>
                                    </Typography>
                                    : <span/>
                                }
                            </ListItem>
                            <div align="center">
                                <Button variant="contained" onClick={handleEvent}>Request submit</Button>
                            </div>
                            <Button style={{float: 'right'}} onClick={handleClose}>Close</Button>
                        </List>
                    </Box>
                </Modal>
            </div>
        </div>
    );
}
