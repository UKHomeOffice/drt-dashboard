import React from "react";
import Button from "@mui/material/Button";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ApiClient from "../services/ApiClient";
import {Helmet} from "react-helmet";
import {adminPageTitleSuffix} from "../utils/common";
import PageContentWrapper from './PageContentWrapper';
import { Breadcrumbs, Typography } from "@mui/material";
import { Link } from "react-router-dom";

export function ExportConfig() {
  return <PageContentWrapper>
    <Helmet>
      <title>Export Config {adminPageTitleSuffix}</title>
    </Helmet>
    <Breadcrumbs>
      <Link to={"/"}>
        Home
      </Link>
      <Typography color="text.primary" sx={{mb:0}}>Export config</Typography>
    </Breadcrumbs>
    <Typography variant="h1">Export Config</Typography>
    <Button
      sx={{maxWidth: '350px'}}
      startIcon={<FileDownloadIcon/>}
      href={`${ApiClient.exportConfigEndpoint}`}
      target="_blank"
    > Download ports config</Button>
  </PageContentWrapper>
}
