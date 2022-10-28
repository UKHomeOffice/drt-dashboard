import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid, GridRowModel} from '@mui/x-data-grid';
import ApiClient from "../../services/ApiClient";
import axios, {AxiosResponse} from "axios";
import UserRequestDetails, {UserRequestedAccessData} from "./UserRequestDetails";
import ConfirmUserAccess from "./ConfirmUserAccess";
import UserAccessApprovedList from "./UserAccessApprovedList";
import {Button} from "@mui/material";
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import {columns, KeyCloakUser} from "./UserAccessCommon";

export default function UserAccess() {
    const [apiRequestListCount, setApiRequestListCount] = React.useState(0);
    const [userRequestList, setUserRequestList] = React.useState([] as UserRequestedAccessData[]);
    const [rowsData, setRowsData] = React.useState([] as GridRowModel[]);
    const [apiRequestCount, setApiRequestCount] = React.useState(0);
    const [openModal, setOpenModal] = React.useState(false)
    const [rowDetails, setRowDetails] = React.useState({} as UserRequestedAccessData | undefined)
    const [selectedRowDetails, setSelectedRowDetails] = React.useState([] as UserRequestedAccessData[]);
    const [selectedRows, setSelectedRows] = React.useState([]);
    const [userDetails, setUserDetails] = React.useState([] as KeyCloakUser[]);
    const [requestPosted, setRequestPosted] = React.useState(false)
    const [dismissedPosted, setDismissedPosted] = React.useState(false)
    const [showApprovedRequests, setShowApprovedUserRequest] = React.useState("Requested")

    const handleChange = (event: React.SyntheticEvent, newValue: string) => {
        setShowApprovedUserRequest(newValue);
        setApiRequestListCount(0);
    };

    const getAccessRequest = (response: AxiosResponse) => {
        setUserRequestList(response.data as UserRequestedAccessData[])
        setRowsData(response.data as GridRowModel[])
    }

    const updateUserDetailsState = (response: AxiosResponse) => {
        console.log('response' + (response.data as KeyCloakUser).email)
        setUserDetails(oldUserDetails => [...oldUserDetails, response.data as KeyCloakUser]);
        console.log('update user details ' + userDetails.length + ' ' + userDetails.map(ud => ud.email))
    }

    const keyCloakUserDetails = (emails: string[]) => {
        emails.map(email => axios.get(ApiClient.userDetailsEndpoint + '/' + email)
            .then(response => updateUserDetailsState(response)))
    }

    const userRequested = () => {
        setApiRequestCount(1)
        axios.get(ApiClient.requestAccessEndPoint + '?status=Requested')
            .then(response => getAccessRequest(response))
    }

    const findEmail = (requestTime: any) => {
        return userRequestList.find(obj => {
            return obj.requestTime.trim() == requestTime
        });
    }

    const rowClickOpen = (userData: UserRequestedAccessData | undefined) => {
        setRowDetails(userData)
        setOpenModal(true)
    }

    const getKeyClockUserDetails = () => {
        setUserDetails([{} as KeyCloakUser]);
        console.log('setUserDetails([{} as KeyCloakUser]) ..' + userDetails.length)
        let fond: any[] = selectedRows.map(s => findEmail(s))
        console.log('fond email' + fond.map(a => a?.email));
        keyCloakUserDetails(fond.map(a => a?.email))
    }

    const addSelectedRowDetails = (srd: any) => {
        setSelectedRowDetails(oldSelectedRowDetails => [...oldSelectedRowDetails, srd])
    }

    const addSelectedRows = (ids: any) => {
        console.log(ids);
        setSelectedRowDetails([])
        if (ids) {
            ids.map((id: string) => addSelectedRowDetails(findEmail(id)))
        }
        setSelectedRows(ids)
    }

    const getRow = (email: string) => {
        return userRequestList.find(sr => sr.email == email)
    }

    const approveUserAccessRequest = (userDetail: any) => {
        if (getRow((userDetail as KeyCloakUser).email)) {
            axios.post(ApiClient.addUserToGroupEndpoint + '/' + (userDetail as KeyCloakUser).id, getRow((userDetail as KeyCloakUser).email))
                .then(response => console.log("User addUserToGroupEndpoint" + response))
                .then(() => setRequestPosted(true))
        }
    }

    React.useEffect(() => {
        if (apiRequestCount == 0) {
            userRequested();
        }
        console.log('React.useEffect user details ' + userDetails.length + ' ' + userDetails.map(ud => ud.email))

        userDetails.map(approveUserAccessRequest)
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
                onRowClick={(params, event: any) => {
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

            <Grid container spacing={2} justifyContent={"center"}>
                <Grid item xs={8} md={2}>
                    <Button variant="outlined" onClick={getKeyClockUserDetails}>Approve</Button>
                </Grid>
                <Grid item xs={8} md={2}>
                    <Button variant="outlined" onClick={dismissUserRequest}>Dismiss</Button>
                </Grid>
            </Grid>
        </Box>
    }

    const dismissUserRequest = () => {
        selectedRowDetails
            .map(selectedRowDetail => axios.post(ApiClient.dismissUserRequestEndpoint, selectedRowDetail)
                .then(response => console.log('dismiss user' + response.data)))
        setDismissedPosted(true)
    }

    const showDismissedRequest = () => {
        return dismissedPosted ?
            <ConfirmUserAccess message={"dismissed"}
                               emails={selectedRowDetails.map(srd => srd.email)}/> : viewSelectAccessRequest()
    }

    const showApprovedOrAccessRequest = () => {
        console.log('userDetails ' + (userDetails as KeyCloakUser[]));
        return requestPosted ?
            <ConfirmUserAccess message={"granted"}
                               emails={userDetails.map(ud => ud.email)}/> : showDismissedRequest()
    }

    const accessRequestOrApprovedList = () => {
        switch (showApprovedRequests) {
            case "Approved" :
                return <UserAccessApprovedList apiRequestCount={apiRequestListCount}
                                               setApiRequestCount={setApiRequestListCount}
                                               statusView={"Approved"} showApprovedUserRequest={showApprovedRequests}
                                               setShowApprovedUserRequest={setShowApprovedUserRequest}/>
            case "Dismissed" :
                return <UserAccessApprovedList apiRequestCount={apiRequestListCount}
                                               setApiRequestCount={setApiRequestListCount}
                                               statusView={"Dismissed"} showApprovedUserRequest={showApprovedRequests}
                                               setShowApprovedUserRequest={setShowApprovedUserRequest}/>
            case "Requested" :
                return showApprovedOrAccessRequest();
        }
    }

    return (
        <Box sx={{width: '100%'}}>
            <Tabs
                value={showApprovedRequests}
                onChange={handleChange}
                textColor="secondary"
                indicatorColor="secondary"
                aria-label="secondary tabs example">
                <Tab value="Requested" label="Requested Access"/>
                <Tab value="Approved" label="Approved Access"/>
                <Tab value="Dismissed" label="Dismissed Access"/>
            </Tabs>
            <div> {accessRequestOrApprovedList()} </div>
        </Box>
    )
}


