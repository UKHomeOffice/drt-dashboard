
import React, {useEffect, useState} from 'react';
import {DataGrid, GridColDef, GridRenderCellParams, GridRowModel} from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {Button} from "@mui/material";
import Box from "@mui/material/Box";
import axios, {AxiosResponse} from "axios";
import {RemoveRegisteredUser} from "./RemoveRegisteredUser";

interface Props {
    seminarId: string | undefined;
    seminarTitle: string | undefined;
    showRegisteredUser: boolean;
    setShowRegisteredUser: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export interface SeminarRegisteredUsers {
    email: string;
    seminarId: string;
    registerTime: string;
    emailSent: string;
}

export function RegisteredUsers(props: Props) {
    const columns: GridColDef[] = [
        {
            field: 'seminarId',
            headerName: 'Id',
            width: 200,
            hide: true,
        },
        {
            field: 'email',
            headerName: 'Email',
            width: 250,
        },
        {
            field: 'registerTime',
            headerName: 'Registration Time',
            width: 150,
        },
        {
            field: 'emailSent',
            headerName: 'Email Sent Time',
            width: 150,
        },
        {
            field: 'delete',
            headerName: 'Unregister',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton aria-label="delete">
                    <DeleteIcon onClick={() => handleRemove(params.row as SeminarRegisteredUsers)}/>
                </IconButton>
            ),
        },
    ];

    const [rowsData, setRowsData] = React.useState([] as GridRowModel[]);
    const [receivedData, setReceivedData] = React.useState(false);
    const [rowDetails, setRowDetails] = React.useState({} as SeminarRegisteredUsers | undefined)
    const [error, setError] = useState(false);
    const [unregister, setUnregister] = useState(false);

    const handleRemove = (userData: SeminarRegisteredUsers | undefined) => {
        setRowDetails(userData)
        setUnregister(true);
    }

    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setRowsData(response.data)
            setReceivedData(true);
        } else {
            setError(true);
            response.data
        }
    }

    useEffect(() => {
        if (!receivedData) {
            axios.get('/seminar-register/users/'   + props.seminarId )
                .then(response => handleResponse(response))
                .then(data => {
                    console.log(data);
                }).catch(error => {
                setError(true);
                console.error(error);
            });
        }
    }, [receivedData]);

    const handleBack = () => {
        setError(false);
        setReceivedData(false)
        props.setShowRegisteredUser(false);
    }

    return (
        error ? <div style={{marginTop: '20px', color: 'red'}}> Errored for the task <br/>
                <Button style={{float: 'right'}} variant="outlined" color="primary" onClick={handleBack}>back</Button>
            </div> :
                    unregister ?
                        <RemoveRegisteredUser id={rowDetails?.seminarId}
                                              email={rowDetails?.email}
                                              showUnregistered={unregister}
                                              setShowUnregistered={setUnregister}
                                              setReceivedData={setReceivedData}/> :
                            <div>
                                <h1>User registered for seminar {props.seminarTitle}</h1>
                                <Box sx={{height: 400, width: '100%'}}>
                                    <DataGrid
                                        getRowId={(rowsData) => rowsData.email+'_'+rowsData.seminarId}
                                        rows={rowsData}
                                        columns={columns}
                                        pageSize={5}
                                        rowsPerPageOptions={[5]}
                                        experimentalFeatures={{newEditingApi: true}}
                                    />
                                    <Button style={{float: 'right'}} variant="outlined"
                                            color="primary"
                                            onClick={handleBack}>back</Button>
                                </Box>
                            </div>
    )
}
