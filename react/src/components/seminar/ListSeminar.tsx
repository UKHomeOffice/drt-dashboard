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
import {DeleteSeminar} from "./DeleteSeminar";
import {EditSeminar} from "./EditSeminar";
import Box from "@mui/material/Box";
import {PublishSeminar} from "./PublishSeminar";
import {ViewSeminar} from "./ViewSeminar";

interface Props {
    setViewSeminars: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export interface SeminarData {
    id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
}

export function ListSeminar(props: Props) {

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
            field: 'description',
            headerName: 'Description',
            width: 200,
        },
        {
            field: 'startTime',
            headerName: 'Start Time',
            width: 150,
        },
        {
            field: 'endTime',
            headerName: 'End Time',
            width: 150,
        },
        {
            field: 'latestUpdateTime',
            headerName: 'Latest Time',
            description: 'This column has a value getter and is not sortable.',
            width: 150,
        },
        {
            field: 'published',
            headerName: 'Published',
            width: 50,
            renderCell: (params: GridRenderCellParams) => (
                <IconButton aria-label="publish">
                    {params.row.published === true ?
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
    ];

    const [rowsData, setRowsData] = React.useState([] as GridRowModel[]);
    const [receivedData, setReceivedData] = React.useState(false);
    const [rowDetails, setRowDetails] = React.useState({} as SeminarData | undefined)
    const [error, setError] = useState(false);
    const [showEdit, setShowEdit] = React.useState(false)
    const [showDelete, setShowDelete] = useState(false);
    const [publish, setPublish] = useState(false);
    const [unPublish, setUnPublish] = useState(false);
    const [view, setView] = useState(false);
    const [listAll, setListAll] = useState(false);
    const handlePublish = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setPublish(true);
    }

    const handleUnPublish = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setUnPublish(true);
    }


    const handleEdit = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setShowEdit(true);
    }

    const handleDelete = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setShowDelete(true);
    }

    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setRowsData(response.data)
            setReceivedData(true);
            props.setViewSeminars(true)
        } else {
            setError(true);
            response.data
        }
    }

    useEffect(() => {
        if (!receivedData) {
            axios.get('/seminar/get/' + listAll)
                .then(response => handleResponse(response))
                .then(data => {
                    console.log(data);
                }).catch(error => {
                setError(true);
                console.error(error);
            });
        }
    }, [receivedData]);

    const handleBack = () => {
        setError(false);
        props.setViewSeminars(false)
        setReceivedData(false)
    }

    const rowClickOpen = (userData: SeminarData | undefined) => {
        setRowDetails(userData)
        setView(true)
    }

    const listAllSeminars = () => {
        setListAll(!listAll)
        setReceivedData(false)
    }

    return (
        error ? <div style={{marginTop: '20px', color: 'red'}}> Errored for the task <br/>
                <Button style={{float: 'right'}} variant="outlined" color="primary" onClick={handleBack}>back</Button>
            </div> :
            publish ? <PublishSeminar id={rowDetails?.id} showAction={publish} setShowAction={setPublish}
                                      setReceivedData={setReceivedData} actionString={"publish"}/> :
                unPublish ? <PublishSeminar id={rowDetails?.id} showAction={unPublish} setShowAction={setUnPublish}
                                            setReceivedData={setReceivedData} actionString={"unPublish"}/> :
                    showDelete ?
                        <DeleteSeminar id={rowDetails?.id} showDelete={showDelete} setShowDelete={setShowDelete}
                                       setReceivedData={setReceivedData}/> :
                        showEdit ? <EditSeminar id={rowDetails?.id} title={rowDetails?.title}
                                                describe={rowDetails?.description}
                                                startTime={rowDetails?.startTime}
                                                endTime={rowDetails?.endTime}
                                                showEdit={showEdit} setShowEdit={setShowEdit}
                                                setReceivedData={setReceivedData}
                            /> :
                            <div>
                                <h1>Seminar List | <a href="#" style={{marginTop: '20px'}}
                                                      onClick={listAllSeminars}>{listAll ? "Ahead Only" : "View all"}</a>
                                </h1>
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
                                <ViewSeminar id={rowDetails?.id} title={rowDetails?.title}
                                             description={rowDetails?.description}
                                             startTime={rowDetails?.startTime}
                                             endTime={rowDetails?.endTime}
                                             view={view} setView={setView}
                                             setReceivedData={setReceivedData} isEdit={true}
                                             showEdit={showEdit} setShowEdit={setShowEdit}/>
                            </div>
    )

}
