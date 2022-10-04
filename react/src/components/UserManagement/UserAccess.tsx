import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid, GridColDef, GridRowModel} from '@mui/x-data-grid';
import ApiClient from "../../services/ApiClient";
import axios, {AxiosResponse} from "axios";
import UserRequestDetails, {UserRequestedAccessData} from "./UserRequestDetails";
import {Button} from "@mui/material";

interface KeyCloakUser {
             id: String,
             username: String,
             enabled: Boolean,
             emailVerified: Boolean,
             firstName: String,
             lastName: String,
             email: String
 }

const columns: GridColDef[] = [
    {
        field: 'email',
        headerName: 'Email',
        width: 200
    },
    {
        field: 'requestTime',
        headerName: 'Request Time',
        width: 200,
    },
    {
        field: 'status',
        headerName: 'status',
        width: 80,
    },
    {
        field: 'portsRequested',
        headerName: 'Ports',
        width: 150,
    },
    {
        field: 'regionsRequested',
        headerName: 'Regions',
        width: 100,
    },
    {
        field: 'allPorts',
        headerName: 'All Ports',
        width: 100,
    },
    {
        field: 'staffing',
        headerName: 'Staffing',
        description: 'This column has a value getter and is not sortable.',
        sortable: false,
        width: 100,
    },
    {
        field: 'lineManager',
        headerName: 'Line Manager',
        width: 200,
    },

];

export default function UserAccess() {
    const [userRequestList, setUserRequestList] = React.useState([]);
    const [rowsData, setRowsData] = React.useState([]);
    const [count, setCount] = React.useState(0);
    const [openModal, setOpenModal] = React.useState(false)
    const [rowDetails, setRowDetails] = React.useState({})
    const [selectedRows,setSelectedRows] = React.useState([]);
    const [userDetails,setUserDetails] = React.useState([]);

    const updateFlightsData = (response: AxiosResponse) => {
        setUserRequestList(response.data as UserRequestedAccessData[])
        setRowsData(response.data as GridRowModel[])
    }

    const updateUserDetails = (response: AxiosResponse) => {
        setUserDetails(response.data as KeyCloakUser)
        console.log('userDetails ' + userDetails.id)
    }

    const updateKeyCloakDetails = (id,userRequestedAccessData) => {
            console.log( 'updateKeyCloakDetails id ' + ApiClient.userDetailsEndpoint+'/'+id)
            axios.post(ApiClient.addUserToGroupEndpoint+'/'+id,userRequestedAccessData)
            .then(response => console.log("User addUserToGroupEndpoint" + response))
            .then(() => console.log("User request response"))
    }

    const useKeyCloakDetails = (email,userRequestedAccessData) => {
            console.log( 'useKeyCloakDetails email ' + ApiClient.userDetailsEndpoint+'/'+email)
            axios.get(ApiClient.userDetailsEndpoint+'/'+email)
            .then(response => updateUserDetails(response))
            .then(() => updateKeyCloakDetails(userDetails.id,userRequestedAccessData))
            .then(() => console.log('after update keycloak userId= '+ userDetails.id + ' userRequestedAccessData= ' + userRequestedAccessData))
    }

    const userRequested = () => {
        setCount(1)
        console.log(ApiClient.requestAccessEndPoint)
        axios.get(ApiClient.requestAccessEndPoint)
            .then(response => updateFlightsData(response))
            .then(() => console.log("User request response"))
    }

    const findEmail = (requestTime: string) => {
        let item = userRequestList.find(obj => {
            return obj.requestTime.trim() == requestTime
        });
        return item;
    }

    const rowClickOpen = (userData: UserRequestedAccessData) => {
        setRowDetails(userData)
        setOpenModal(true)
    }

    const addUserToGroups = () => {
        let fond  = selectedRows.map ( s => findEmail(s)) ;
        console.log('addUserToGroups ' +  selectedRows)
        console.log('addUserToGroups fond rows ' + fond.map(i => i.email) + ' ' + fond.map(i => useKeyCloakDetails(i.email,i)))

    }

    const addSelectedRows = (ids) => {
            console.log(ids);
            setSelectedRows(ids)
    }

    React.useEffect(() => {
        if (count == 0) {
            userRequested();
        }
    });

    return (
        <Box sx={{height: 400, width: '100%'}}>
            <DataGrid
                getRowId={(rowsData) => rowsData.requestTime}
                rows={rowsData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                checkboxSelection
                onSelectionModelChange={addSelectedRows}
                experimentalFeatures={{newEditingApi: true}}
                onRowClick={(params, event) => {
                    if (!event.ignore) {
                        rowClickOpen(findEmail(params.row.requestTime));
                    }
                }}
            />
            {(openModal) ? <UserRequestDetails openModal={openModal}
                                               setOpenModal={setOpenModal}
                                               rowDetails={rowDetails}/> : <span/>
            }

            <div align="center">
             <Button variant="outlined" color="primary" onClick={addUserToGroups}>Approve</Button>
            </div>
        </Box>

    );
}
