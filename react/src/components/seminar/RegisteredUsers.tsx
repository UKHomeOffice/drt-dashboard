import React, {useEffect, useState} from 'react';
import {DataGrid, GridColDef, GridRenderCellParams, GridRowModel} from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import {Button, Snackbar} from "@mui/material";
import Box from "@mui/material/Box";
import axios, {AxiosResponse} from "axios";
import {DialogActionComponent} from "./DialogActionComponent";
import {Redirect, useParams} from "react-router-dom";
import {SeminarData} from "./ListSeminars";
import {Alert} from "../DialogComponent";

export interface SeminarRegisteredUsers {
    email: string;
    seminarId: string;
    registeredAt: string;
    emailSentAt: string;
}

export function RegisteredUsers() {
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
    const {seminarId} = useParams<{ seminarId: string }>();
    const [rowsData, setRowsData] = React.useState([] as GridRowModel[]);
    const [rowDetails, setRowDetails] = React.useState({} as SeminarRegisteredUsers | undefined)
    const [selectedRow, setSelectedRow] = React.useState<SeminarData | null>(null);
    const [error, setError] = useState(false);
    const [unregister, setUnregister] = useState(false);
    const [redirectTo, setRedirectTo] = useState(null);

    const handleRemove = (userData: SeminarRegisteredUsers | undefined) => {
        setRowDetails(userData)
        setUnregister(true);
    }

    const handleSeminarResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setSelectedRow(response.data)
        } else {
            setError(true);
        }
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
        axios.get('/seminar-register/users/' + seminarId)
            .then(response => handleResponse(response))
            .then(data => {
                console.log(data);
            }).catch(error => {
            setError(true);
            console.error(error);
        });
        axios.get('/seminar/get/' + seminarId)
            .then(response => handleSeminarResponse(response))
            .then(data => {
                console.log(data);
            }).catch(error => {
            setError(true);
            console.error(error);
        });
    }, [seminarId]);

    const handleBack = () => {
        setError(false);
        setRedirectTo('/seminars/list');
    }

    return (
        <div>
            {redirectTo && <Redirect to={redirectTo}/>}
            {<div>
                <Snackbar
                    anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                    open={error}
                    autoHideDuration={6000}
                    onClose={() => setError(false)}>
                    <Alert onClose={() => setError(false)} severity="error" sx={{width: '100%'}}>
                        There was a problem booking seminars. Please try reloading the page.
                    </Alert>
                </Snackbar>
                <h1>Seminar registrations - {selectedRow?.title}</h1>
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
            } </div>
    )
}
