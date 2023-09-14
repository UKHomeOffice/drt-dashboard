import React, {useEffect, useState} from 'react';
import {DataGrid, GridColDef, GridRenderCellParams, GridRowModel} from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {Button} from "@mui/material";
import Box from "@mui/material/Box";
import axios, {AxiosResponse} from "axios";
import {DialogActionComponent} from "./DialogActionComponent";

interface Props {
    seminarId: string | undefined;
    seminarTitle: string | undefined;
    showRegisteredUser: boolean;
    setShowRegisteredUser: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export interface SeminarRegisteredUsers {
    email: string;
    seminarId: string;
    registeredAt: string;
    emailSentAt: string;
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
            field: 'registeredAt',
            headerName: 'Registration Time',
            width: 150,
        },
        {
            field: 'emailSentAt',
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
        } else {
            setError(true);
            response.data
        }
    }

    useEffect(() => {
        axios.get('/seminar-register/users/' + props.seminarId)
            .then(response => handleResponse(response))
            .then(data => {
                console.log(data);
            }).catch(error => {
            setError(true);
            console.error(error);
        });
    }, [unregister]);

    const handleBack = () => {
        setError(false);
        props.setShowRegisteredUser(false);
    }

    return (
        error ?
            <div style={{marginTop: '20px', color: 'red'}}> There was a problem booking seminars. Please try reloading
                the page. <br/>
                <Button style={{float: 'right'}} variant="outlined" color="primary" onClick={handleBack}>back</Button>
            </div> :
            <div>
                <h2>User registered for seminar {props.seminarTitle}</h2>
                <Box sx={{height: 400, width: '100%'}}>
                    <DataGrid
                        getRowId={(rowsData) => rowsData.email + '_' + rowsData.seminarId}
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
                <DialogActionComponent id={rowDetails?.seminarId}
                                       actionString='unregister'
                                       actionMethod='DELETE'
                                       showDialog={unregister}
                                       setShowDialog={setUnregister}
                                       actionUrl={'/seminar-register/remove/' + rowDetails?.seminarId + '/' + rowDetails?.email}
                />
            </div>

    )
}
