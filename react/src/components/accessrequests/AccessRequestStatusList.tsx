import * as React from 'react';
import Box from '@mui/material/Box';
import {DataGrid, GridRowModel} from '@mui/x-data-grid';
import ApiClient from "../../services/ApiClient";
import axios, {AxiosResponse} from "axios";
import AccessRequestDetails, {UserRequestedAccessData} from "./AccessRequestDetails";
import {columns} from "./AccessRequestCommon";

interface IProps {
  accessRequestListRequested: boolean
  setAccessRequestListRequested: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
  statusView: string;
  showUserRequestByStatus: string;
  setShowUserRequestByStatus: ((value: (((prevState: string) => string) | string)) => void);
}

export default function AccessRequestStatusList(props: IProps) {
  const [userRequestList, setUserRequestList] = React.useState<UserRequestedAccessData[]>([]);
  const [rowsData, setRowsData] = React.useState<GridRowModel[]>([]);
  const [accessRequest, setAccessRequest] = React.useState<UserRequestedAccessData | undefined>(undefined)
  const [openModal, setOpenModal] = React.useState<boolean>(false)

  const updateAccessRequestData = (response: AxiosResponse) => {
    setUserRequestList(response.data as UserRequestedAccessData[])
    setRowsData(response.data as GridRowModel[])
  }

  const requestAccessRequestsWithStatus = () => {
    props.setAccessRequestListRequested(true)
    axios.get(ApiClient.requestAccessEndPoint + '?status=' + props.statusView)
      .then(response => updateAccessRequestData(response))
  }

  React.useEffect(() => {
    if (!props.accessRequestListRequested) {
      requestAccessRequestsWithStatus();
    }
  });

  const findEmail = (requestTime: string) => {
    return userRequestList.find(obj => {
      return obj.requestTime.trim() == requestTime
    });
  }

  const rowClickOpen = (userData: UserRequestedAccessData | undefined) => {
    setAccessRequest(userData)
    setOpenModal(true)
  }

  return (
    <Box sx={{height: 400, width: '100%'}}>
      <DataGrid
        getRowId={(rowsData) => rowsData.requestTime}
        rows={rowsData}
        columns={columns}
        pageSizeOptions={[5]}
        onRowClick={(params, event: any) => {
          if (!event.ignore) {
            rowClickOpen(findEmail(params.row.requestTime));
          }
        }}
      />
      {
        (openModal && accessRequest) ?
          <AccessRequestDetails openModal={openModal}
                                setOpenModal={setOpenModal}
                                receivedUserDetails={props.accessRequestListRequested}
                                setReceivedUserDetails={props.setAccessRequestListRequested}
                                accessRequest={accessRequest}
                                status={props.statusView}/> :
          <span/>
      }
    </Box>
  );
}
