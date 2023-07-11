import React, {useEffect, useState} from "react";
import axios, {AxiosResponse} from "axios";
import {DataGrid, GridColDef, GridRowModel} from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import {Button} from "@mui/material";
import {PreviewComponent} from "./PreviewComponent";


interface Props {
    setViewFeatureGuides: ((value: (((prevState: boolean) => boolean) | boolean)) => void);
}

export interface FeatureData {
    id: string;
    title: string;
    fileName: string;
    uploadTime: string;
    markdownContent: string;
}

export const featureColumns: GridColDef[] = [
    {
        field: 'id',
        headerName: 'Id',
        width: 50
    },
    {
        field: 'title',
        headerName: 'Title',
        width: 200,
    },
    {
        field: 'fileName',
        headerName: 'File Name',
        width: 200,
    },
    {
        field: 'uploadTime',
        headerName: 'Upload Time',
        description: 'This column has a value getter and is not sortable.',
        sortable: false,
        width: 200,
    },
    {
        field: 'markdownContent',
        headerName: 'Markdown Content',
        width: 400,
    },

];

const ListFeatureGuide: React.FC = (props: Props) => {
    const [rowsData, setRowsData] = React.useState([] as GridRowModel[]);
    const [receivedData, setReceivedData] = React.useState(false);
    const [openPreview, setOpenPreview] = React.useState(false)
    const [rowDetails, setRowDetails] = React.useState({} as FeatureData | undefined)
    const [error, setError] = useState(false);

    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            props.setViewFeatureGuides(true)
            setRowsData(response.data)
            setReceivedData(true);
        } else {
            setError(true);
            response.data
        }
    }

    useEffect(() => {
        if (!receivedData) {
            axios.get('/guide/getFeatureGuides')
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
        props.setViewFeatureGuides(false)
        setReceivedData(false)
    }

    const rowClickOpen = (userData: FeatureData | undefined) => {
        setRowDetails(userData)
        setOpenPreview(true)
    }

    return (
        error ? <div style={{marginTop: '20px', color: 'red'}}> There is problem while retrieving the list <br/>
                <Button style={{float: 'right'}} variant="outlined" color="primary" onClick={handleBack}>back</Button>
            </div> :
            <div>
                <h1>Feature Guide List</h1>
                <Box sx={{height: 400, width: '100%'}}>
                    <DataGrid
                        getRowId={(rowsData) => rowsData.id}
                        rows={rowsData}
                        columns={featureColumns}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                        experimentalFeatures={{newEditingApi: true}}
                        onRowClick={(params, event: any) => {
                            if (!event.ignore) {
                                rowClickOpen(params.row as FeatureData);
                            }
                        }}
                    />
                    <Button style={{float: 'right'}} variant="outlined"
                            color="primary"
                            onClick={handleBack}>back</Button>
                </Box>
                <PreviewComponent title={rowDetails?.title} markdownContent={rowDetails?.markdownContent}
                                  openPreview={openPreview} setOpenPreview={setOpenPreview}/>

            </div>
    )
}


export default ListFeatureGuide;
