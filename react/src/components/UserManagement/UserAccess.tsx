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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export default function UserAccess() {
    const [userRequestList, setUserRequestList] = React.useState([]);
    const [rowsData, setRowsData] = React.useState([]);
    const [apiRequestCount, setApiRequestCount] = React.useState(0);
    const [openModal, setOpenModal] = React.useState(false)
    const [rowDetails, setRowDetails] = React.useState({})
    const [selectedRows, setSelectedRows] = React.useState([]);
    const [userDetails, setUserDetails] = React.useState({});
    const [requestPosted, setRequestPosted] = React.useState(false)
    const [showApprovedRequests, setShowApprovedUserRequest] = React.useState("Requested")

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setShowApprovedUserRequest(newValue);
    };

    const getAccessRequest = (response: AxiosResponse) => {
        setUserRequestList(response.data as UserRequestedAccessData[])
        setRowsData(response.data as GridRowModel[])
    }

    const updateUserDetailsState = (response: AxiosResponse) => {
        setUserDetails(response.data as KeyCloakUser);
    }

    const keyCloakUserDetails = (email: string) => {
        axios.get(ApiClient.userDetailsEndpoint + '/' + email)
            .then(response => updateUserDetailsState(response))
    }

    const userRequested = () => {
        setApiRequestCount(1)
        axios.get(ApiClient.requestAccessEndPoint + '?status=Requested')
            .then(response => getAccessRequest(response))
    }

    const findEmail = (requestTime: string) => {
        return userRequestList.find(obj => {
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

    const addSelectedRows = (ids: string) => {
        console.log(ids);
        setSelectedRows(ids)
    }

    const getRow = (email: string) => {
        return userRequestList.find(sr => sr.email == email)
    }

    React.useEffect(() => {
        if (apiRequestCount == 0) {
            userRequested();
        }

        axios.post(ApiClient.addUserToGroupEndpoint + '/' + (userDetails as KeyCloakUser).id, getRow((userDetails as KeyCloakUser).email))
            .then(response => console.log("User addUserToGroupEndpoint" + response))
            .then(() => setRequestPosted(true))
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
                                               rowDetails={rowDetails}
                                               approvedPage={false}/> : <span/>
            }
            <Grid container justifyContent="center">
                <Button variant="contained" color="primary" onClick={approveUserAccessRequest}>Approve</Button>
            </Grid>
        </Box>
    }

    const showApprovedOrAccessRequest = () => {
        return requestPosted ? <UserAccessApproved userDetails={userDetails}/> : viewSelectAccessRequest()
    }

    const accessRequestOrApprovedList = () => {
        return <div>{showApprovedRequests == "Approved" ? <UserAccessApprovedList showApprovedRequests={showApprovedRequests}
                                                                    setShowApprovedUserRequest={setShowApprovedUserRequest}/> : showApprovedOrAccessRequest()}</div>
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs
                value={showApprovedRequests}
                onChange={handleChange}
                textColor="secondary"
                indicatorColor="secondary"
                aria-label="secondary tabs example">
                <Tab value="Requested" label="Requested Access" />
                <Tab value="Approved" label="Approved Access" />
            </Tabs>
            <div> {accessRequestOrApprovedList()} </div>
        </Box>
    )
}

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
