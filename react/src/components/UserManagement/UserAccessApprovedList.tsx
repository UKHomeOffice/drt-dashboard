import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid, GridColDef, GridRowModel} from '@mui/x-data-grid';
import ApiClient from "../../services/ApiClient";
import axios, {AxiosResponse} from "axios";
import UserRequestDetails, {UserRequestedAccessData} from "./UserRequestDetails";
import {Button} from "@mui/material";

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

interface IProps {
    showApprovedUserRequest: boolean;
    setShowApprovedUserRequest: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export default function UserAccessApprovedList(props: IProps) {
    const [userRequestList, setUserRequestList] = React.useState([]);
    const [rowsData, setRowsData] = React.useState([]);
    const [apiRequestCount, setApiRequestCount] = React.useState(0);
    const [rowDetails, setRowDetails] = React.useState({})
    const [openModal, setOpenModal] = React.useState(false)

    const updateAccessRequestData = (response: AxiosResponse) => {
        setUserRequestList(response.data as UserRequestedAccessData[])
        setRowsData(response.data as GridRowModel[])
    }

    const approvedAccessApi = () => {
        setApiRequestCount(1)
        axios.get(ApiClient.requestAccessEndPoint + '?status=Approved')
            .then(response => updateAccessRequestData(response))
            .then(() => console.log("User request response"))
    }

    const resetApprovedUserRequest = () => {
        props.setShowApprovedUserRequest(false)
    }

    React.useEffect(() => {
        if (apiRequestCount == 0) {
            approvedAccessApi();
        }
    });

    const findEmail = (requestTime: string) => {
        let item = userRequestList.find(obj => {
            return obj.requestTime.trim() == requestTime
        });
        return item;
    }

    const rowClickOpen = (userData: UserRequestedAccessData) => {
        setRowDetails(userData)
        setOpenModal(true)
        console.log('rowClickOpen ' + openModal)
    }

    return (
        <Box sx={{height: 400, width: '100%'}}>
            <DataGrid
                getRowId={(rowsData) => rowsData.requestTime}
                rows={rowsData}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5]}
                onSelectionModelChange
                experimentalFeatures={{newEditingApi: true}}
                onRowClick={(params, event) => {
                    if (!event.ignore) {
                        rowClickOpen(findEmail(params.row.requestTime));
                    }
                }}
            />
            {
                (openModal) ?
                    <UserRequestDetails openModal={openModal} setOpenModal={setOpenModal} rowDetails={rowDetails}/> :
                    <span/>
            }
            <div align="left">
            </div>
            <div align="right">
                <Button variant="outlined" color="primary" onClick={resetApprovedUserRequest}>back</Button>
            </div>
        </Box>

    );
}
