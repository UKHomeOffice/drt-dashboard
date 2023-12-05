import React, {useState} from "react";
import {DataGrid, GridColDef} from "@mui/x-data-grid";
import moment from "moment-timezone";
import Box from "@mui/material/Box";
import {useUserFeedbacks} from "../../store/feedbacks";
import Loading from "../Loading";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import {Breadcrumbs, Stack} from "@mui/material";
import {Link} from "react-router-dom";
import ApiClient from "../../services/ApiClient";

export function FeedbackList() {
  const [requestedAt, setRequestedAt] = useState(moment().valueOf())

  const {userFeedbacks, loading, failed} = useUserFeedbacks(requestedAt)

  const abFeatureColumns: GridColDef[] = [
    {
      field: 'email',
      headerName: 'Email',
      width: 150,
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 150,
      renderCell: (params) => {
        return <div>{moment(params.value).format("HH:mm, Do MMM YYYY")}</div>;
      }
    },
    {
      field: 'closeBanner',
      headerName: 'X Banner',
      description: 'User closed the banner',
      width: 75
    },
    {
      field: 'feedbackType',
      headerName: 'Feedback',
      description: 'Feedback type',
      width: 80,
    },
    {
      field: 'bfRole',
      headerName: 'BF Role',
      width: 150
    },
    {
      field: 'drtQuality',
      headerName: 'Quality',
      width: 100,
    },
    {
      field: 'drtLikes',
      headerName: 'Likes',
      width: 150,
    },
    {
      field: 'drtImprovements',
      headerName: 'Improvements',
      width: 150
    },
    {
      field: 'participationInterest',
      headerName: 'Interest',
      width: 60,
    },
    {
      field: 'abVersion',
      headerName: 'AB Version',
      width: 50,
    },
  ];


  const handleDownload = async () => {
    setRequestedAt(moment().valueOf())
    try {
      const response = await fetch(`${ApiClient.feedBacksEndpoint}/export`);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'feedback-export.csv'

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  return <Stack gap={4} alignItems={'stretch'} sx={{mt: 2}}>
    <Breadcrumbs>
      <Link to={"/"}>
        Home
      </Link>
      <Typography color="text.primary">User feedback responses</Typography>
    </Breadcrumbs>
    <Stack direction={'row'} justifyContent={'space-between'}>
      <Button startIcon={<FileDownloadIcon/>} onClick={handleDownload}>Download feedback responses</Button>
    </Stack>
    {loading ? <Loading/> :
      failed ?
        <Typography variant={'body1'}>Sorry, I couldn't load the existing pauses</Typography> :
        userFeedbacks.length === 0 ?
          <Typography variant={'body1'}>There are no current or upcoming pauses</Typography> :
          <Box sx={{height: 400, width: '100%'}}>
            <DataGrid
              getRowId={(rowsData) => rowsData.email + '_' + rowsData.createdAt}
              rows={userFeedbacks}
              columns={abFeatureColumns}
              pageSizeOptions={[5]}
            />
          </Box>
    }
  </Stack>
}
