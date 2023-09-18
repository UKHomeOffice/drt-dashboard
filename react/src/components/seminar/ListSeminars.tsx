import React, {useEffect, useState} from "react";
import {DataGrid, GridColDef, GridRenderCellParams, GridRowModel} from "@mui/x-data-grid";
import IconButton from "@mui/material/IconButton";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import PreviewIcon from "@mui/icons-material/Preview";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import axios, {AxiosResponse} from "axios";
import {Snackbar} from "@mui/material";
import Box from "@mui/material/Box";
import {ViewSeminar} from "./ViewSeminar";
import {CalendarViewMonth} from "@mui/icons-material";
import {DialogActionComponent} from "./DialogActionComponent";
import moment from 'moment-timezone';
import {Link, useParams} from "react-router-dom";
import {Alert} from "../DialogComponent";

export function stringToUKDate(date?: string): string | undefined {
    if (!date) {
        return undefined;
    }

    const ukDatetime = moment.tz(date, "YYYY-MM-DD HH:mm:ss.S", "Europe/London");
    return ukDatetime.format('YYYY-MM-DD HH:mm');
}

export interface SeminarData {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    meetingLink: string;
    isPublished: boolean;
}

export function ListSeminars() {

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
                <Link to={`/seminars/edit/${params.row.id}`}>
                    <IconButton aria-label="edit">
                        <EditIcon/>
                    </IconButton>
                </Link>
            ),
        },
        {
            field: 'users',
            headerName: 'Users',
            width: 50,
            renderCell: (params: GridRenderCellParams) => (
                <Link to={`/seminars/registeredUsers/${params.row.id}`}>
                    <IconButton aria-label="users-registered">
                        <CalendarViewMonth/>
                    </IconButton>
                </Link>
            ),
        },
    ];
    const {listAll: listAllParam} = useParams<{ listAll?: string }>();
    const listAll = listAllParam ? listAllParam === 'true' : false;
    const [rowsData, setRowsData] = React.useState([] as GridRowModel[]);
    const [error, setError] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [publish, setPublish] = useState(false);
    const [unPublish, setUnPublish] = useState(false);
    const [view, setView] = useState(false);
    const [rowDetails, setRowDetails] = React.useState({} as SeminarData | undefined);

    const handlePublish = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setPublish(true);
    }

    const handleUnPublish = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setUnPublish(true);
    }


    const handleDelete = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setShowDelete(true);
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
        axios.get('/seminar/getList/' + listAll)
            .then(response => handleResponse(response))
            .then(data => {
                console.log(data);
            }).catch(error => {
            setError(true);
            console.error(error);
        });
    }, [listAll, unPublish, publish, showDelete]);

    const handleBack = () => {
        setError(false);
    }

    const rowClickOpen = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setView(true)
    }

    return (
        <div>
            <h1>Seminar List</h1>
            <Snackbar
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                open={error}
                autoHideDuration={6000}
                onClose={() => handleBack}>
                <Alert onClose={handleBack} severity="success" sx={{width: '100%'}}>
                    There was a problem fetching the list of seminars. Please try reloading the page.
                </Alert>
            </Snackbar>
            <Box sx={{height: 400, width: '100%'}}>
                <DataGrid
                    getRowId={(rowsData) => rowsData.id}
                    rows={rowsData}
                    columns={seminarColumns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    experimentalFeatures={{newEditingApi: true}}
                />
            </Box>
            <ViewSeminar id={rowDetails?.id} title={rowDetails?.title}
                         startTime={rowDetails?.startTime}
                         endTime={rowDetails?.endTime}
                         meetingLink={rowDetails?.meetingLink}
                         view={view} setView={setView}
            />
            <DialogActionComponent actionMethod='DELETE'
                                   actionString='remove seminar'
                                   actionUrl={'/seminar/delete/' + rowDetails?.id}
                                   showDialog={showDelete}
                                   setShowDialog={setShowDelete}
            />
            <DialogActionComponent actionUrl={'/seminar/published/' + rowDetails?.id}
                                   actionString="publish"
                                   actionMethod="POST"
                                   showDialog={publish}
                                   setShowDialog={setPublish}
            />
            <DialogActionComponent actionUrl={'/seminar/published/' + rowDetails?.id}
                                   actionString="unPublish"
                                   actionMethod="POST"
                                   showDialog={unPublish}
                                   setShowDialog={setUnPublish}
            />
        </div>
    )

}
