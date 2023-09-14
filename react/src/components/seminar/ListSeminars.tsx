import React, {useEffect, useState} from "react";
import {DataGrid, GridColDef, GridRenderCellParams, GridRowModel} from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import PreviewIcon from "@mui/icons-material/Preview";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import axios, {AxiosResponse} from "axios";
import {Button} from "@mui/material";
import Box from "@mui/material/Box";
import {ViewSeminar} from "./ViewSeminar";
import {CalendarViewMonth} from "@mui/icons-material";
import {DialogActionComponent} from "./DialogActionComponent";
import moment from 'moment-timezone';

export function stringToUKDate(date?: string): string | undefined {
    if (!date) {
        return undefined;
    }

    const ukDatetime = moment.tz(date, "YYYY-MM-DD HH:mm:ss.S", "Europe/London");
    return ukDatetime.format('YYYY-MM-DD HH:mm');
}

interface Props {
    listAll: boolean;
    rowDetails: SeminarData | undefined;
    setRowDetails: ((value: (((prevState: SeminarData | undefined) => SeminarData | undefined) | SeminarData | undefined)) => void);
    showRegisteredUser: boolean;
    setShowRegisteredUser: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    setListAll: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    setViewSeminars: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
    showEdit: boolean;
    setShowEdit: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export interface SeminarData {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    meetingLink: string;
    isPublished: boolean;
}

export function ListSeminars(props: Props) {

    const seminarColumns: GridColDef[] = [
        {
            field: 'id',
            headerName: 'Id',
            width: 50
        },
        {
            field: 'title',
            headerName: 'Title',
            width: 150,
        },
        {
            field: 'startTime',
            headerName: 'Start Time',
            width: 150,
            renderCell: (params) => {
                return <div>{stringToUKDate(params.value)}</div>;
            }

        },
        {
            field: 'endTime',
            headerName: 'End Time',
            width: 150,
            renderCell: (params) => {
                return <div>{stringToUKDate(params.value)}</div>;
            }
        },
        {
            field: 'meetingLink',
            headerName: 'Meeting Link',
            description: 'This column has a value getter and is not sortable.',
            width: 100,
            renderCell: (params: GridRenderCellParams) => (
                <a href={params.row.meetingLink} target="_blank">Team link</a>
            ),
        },
        {
            field: 'latestUpdateTime',
            headerName: 'Latest Time',
            description: 'This column has a value getter and is not sortable.',
            width: 150,
        },
        {
            field: 'isPublished',
            headerName: 'Published',
            width: 50,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton aria-label="publish">
                    {params.row.isPublished === true ?
                        <PublishIcon onClick={() => handleUnPublish(params.row as SeminarData)}/> :
                        <UnpublishedIcon onClick={() => handlePublish(params.row as SeminarData)}/>}
                </IconButton>
            ),
        },
        {
            field: 'view',
            headerName: 'view',
            width: 50,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton aria-label="view">
                    <PreviewIcon onClick={() => rowClickOpen(params.row as SeminarData)}/>
                </IconButton>
            ),
        },
        {
            field: 'delete',
            headerName: 'Delete',
            width: 50,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton aria-label="delete">
                    <DeleteIcon onClick={() => handleDelete(params.row as SeminarData)}/>
                </IconButton>
            ),
        },
        {
            field: 'edit',
            headerName: 'Edit',
            width: 50,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton aria-label="delete">
                    <EditIcon onClick={() => handleEdit(params.row as SeminarData)}/>
                </IconButton>
            ),
        },
        {
            field: 'users',
            headerName: 'Users',
            width: 50,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton aria-label="users-registered">
                    <CalendarViewMonth onClick={() => handleRegisteredUsers(params.row as SeminarData)}/>
                </IconButton>
            ),
        },
    ];

    const [rowsData, setRowsData] = React.useState([] as GridRowModel[]);
    const [error, setError] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [publish, setPublish] = useState(false);
    const [unPublish, setUnPublish] = useState(false);
    const [view, setView] = useState(false);
    const handlePublish = (userData: SeminarData | undefined) => {
        props.setRowDetails(userData)
        setPublish(true);
    }

    const handleUnPublish = (userData: SeminarData | undefined) => {
        props.setRowDetails(userData)
        setUnPublish(true);
    }

    const handleEdit = (userData: SeminarData | undefined) => {
        props.setRowDetails(userData)
        props.setViewSeminars(false);
        props.setShowEdit(true);
    }

    const handleRegisteredUsers = (userData: SeminarData | undefined) => {
        props.setRowDetails(userData)
        props.setViewSeminars(false);
        props.setShowEdit(false);
        props.setShowRegisteredUser(true);
    }

    const handleDelete = (userData: SeminarData | undefined) => {
        props.setRowDetails(userData)
        setShowDelete(true);
    }

    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setRowsData(response.data)
            props.setViewSeminars(true)
        } else {
            setError(true);
            response.data
        }
    }

    useEffect(() => {
        axios.get('/seminar/get/' + props.listAll)
            .then(response => handleResponse(response))
            .then(data => {
                console.log(data);
            }).catch(error => {
            setError(true);
            console.error(error);
        });
    }, [props.listAll, props.showRegisteredUser, unPublish, publish, showDelete]);

    const handleBack = () => {
        setError(false);
        props.setViewSeminars(false)
    }

    const rowClickOpen = (userData: SeminarData | undefined) => {
        props.setRowDetails(userData)
        setView(true)
    }

    return (
        error ?
            <div style={{marginTop: '20px', color: 'red'}}> There was a problem fetching the list of seminars. Please
                try reloading the page. <br/>
                <Button style={{float: 'right'}} variant="outlined" color="primary" onClick={handleBack}>back</Button>
            </div> :
            <div>
                <Box sx={{height: 400, width: '100%'}}>
                    <DataGrid
                        getRowId={(rowsData) => rowsData.id}
                        rows={rowsData}
                        columns={seminarColumns}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                        experimentalFeatures={{newEditingApi: true}}
                    />
                    <Button style={{float: 'right'}} variant="outlined"
                            color="primary"
                            onClick={handleBack}>back</Button>
                </Box>
                <ViewSeminar id={props.rowDetails?.id} title={props.rowDetails?.title}
                             startTime={props.rowDetails?.startTime}
                             endTime={props.rowDetails?.endTime}
                             meetingLink={props.rowDetails?.meetingLink}
                             view={view} setView={setView}
                             isEdit={true}
                             showEdit={props.showEdit} setShowEdit={props.setShowEdit}/>
                <DialogActionComponent id={props.rowDetails?.id}
                                       actionMethod='DELETE'
                                       actionString='remove seminar'
                                       actionUrl={'/seminar/delete/' + props.rowDetails?.id}
                                       showDialog={showDelete}
                                       setShowDialog={setShowDelete}
                />
                <DialogActionComponent id={props.rowDetails?.id}
                                       actionUrl={'/seminar/published/' + props.rowDetails?.id}
                                       actionString="publish"
                                       actionMethod="POST"
                                       showDialog={publish}
                                       setShowDialog={setPublish}
                />
                <DialogActionComponent id={props.rowDetails?.id}
                                       actionUrl={'/seminar/published/' + props.rowDetails?.id}
                                       actionString="unPublish"
                                       actionMethod="POST"
                                       showDialog={unPublish}
                                       setShowDialog={setUnPublish}
                />
            </div>
    )

}
