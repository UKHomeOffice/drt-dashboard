import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid, GridColDef, GridRowModel} from '@mui/x-data-grid';
import ApiClient from "../../services/ApiClient";
import axios, {AxiosResponse} from "axios";
import UserRequestDetails, {UserRequestedAccessData} from "./UserRequestDetails";
import UserAccessApproved from "./UserAccessApproved";
import UserAccessApprovedList from "./UserAccessApprovedList";
import {Button} from "@mui/material";
import Grid from '@mui/material/Grid';

export interface KeyCloakUser {
    id: string,
    username: string,
    enabled: boolean,
    emailVerified: boolean,
    firstName: string,
    lastName: string,
    email: string
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
        field: 'staff_editing',
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
    const [apiRequestCount, setApiRequestCount] = React.useState(0);
    const [openModal, setOpenModal] = React.useState(false)
    const [rowDetails, setRowDetails] = React.useState({})
    const [selectedRows, setSelectedRows] = React.useState([]);
    const [userDetails, setUserDetails] = React.useState([]);
    const [requestPosted, setRequestPosted] = React.useState(false)
    const [showApprovedRequests, setShowApprovedUserRequest] = React.useState(false)

    const getAccessRequest = (response: AxiosResponse) => {
        setUserRequestList(response.data as UserRequestedAccessData[])
        setRowsData(response.data as GridRowModel[])
    }

    const updateUserDetailsState = (response: AxiosResponse) => {
        setUserDetails([...userDetails, response.data as KeyCloakUser]);
    }

    const keyCloakUserDetails = (email:string) => {
        axios.get(ApiClient.userDetailsEndpoint + '/' + email)
            .then(response => updateUserDetailsState(response))
    }

    const userRequested = () => {
        setApiRequestCount(1)
        axios.get(ApiClient.requestAccessEndPoint + '?status=Requested')
            .then(response => getAccessRequest(response))
    }

    const findEmail = (requestTime: string) => {
       return  userRequestList.find(obj => {
            return obj.requestTime.trim() == requestTime
        });
    }

    const rowClickOpen = (userData: UserRequestedAccessData) => {
        setRowDetails(userData)
        setOpenModal(true)
    }

    const approveUserAccessRequest = () => {
        setUserDetails([]);
        let fond = selectedRows.map(s => findEmail(s))
        fond.map(i => keyCloakUserDetails(i.email))
    }

    const addSelectedRows = (ids:string) => {
        console.log(ids);
        setSelectedRows(ids)
    }

    const getRow = (email:string) => {
        return userRequestList.find(sr => sr.email == email)
    }
    const viewApprovedUserRequest = () => {
        setShowApprovedUserRequest(true)
    }

    React.useEffect(() => {
        if (apiRequestCount == 0) {
            userRequested();
        }

        userDetails.map(ud =>
            axios.post(ApiClient.addUserToGroupEndpoint + '/' + ud.id, getRow(ud.email))
                .then(response => console.log("User addUserToGroupEndpoint" + response))
                .then(() => setRequestPosted(true))
        )
    }, [userDetails]);

    const viewSelectAccessRequest = () => {
        return <Box sx={{height: 400, width: '100%'}}>
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
            <Grid container>
                <Grid xs={12} md={12}>
                    <div></div>
                </Grid>
                <Grid xs={12} md={12}>
                    <div><Button variant="outlined" color="primary" onClick={viewApprovedUserRequest}>View
                        Approved</Button></div>
                </Grid>
                <Grid xs={12} align="center" md={12}>
                    <div><Button variant="contained" color="primary" onClick={approveUserAccessRequest}>Approve</Button></div>
                </Grid>
            </Grid>
        </Box>
    }

    const showApprovedOrAccessRequest = () => {
        return requestPosted ? <UserAccessApproved userDetails={userDetails}/> : viewSelectAccessRequest()
    }

    const accessRequestOrApprovedList = () => {
        return <div>{showApprovedRequests ? <UserAccessApprovedList showApprovedRequests={showApprovedRequests}
                                                                    setShowApprovedUserRequest={setShowApprovedUserRequest}/> : showApprovedOrAccessRequest()}</div>
    }

    return (
        <div> {accessRequestOrApprovedList()} </div>
    );
}
