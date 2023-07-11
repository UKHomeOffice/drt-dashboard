import React from "react";
import {Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

interface Props {
    videoURL: string | undefined;
    title: string | undefined;
    markdownContent: string | undefined;
    openPreview: boolean;
    setOpenPreview: ((value: (((prevState: boolean) => boolean) | boolean)) => void);

}

export function PreviewComponent(props: Props) {

    const handlePreviewClose = () => {
        props.setOpenPreview(false)
    }

    return (
        <div>
            <Dialog open={props.openPreview} maxWidth="lg" fullWidth="true" onClose={handlePreviewClose}>
                <Grid container spacing={2}>
                    <Grid item xs={10}>
                        <DialogTitle sx={{
                            "color": "#233E82",
                            "backgroundColor": "#E6E9F1",
                            "font-size": "40px",
                            "font-weight": "bold",
                        }}>
                            New features available for DRT (preview)
                        </DialogTitle>
                    </Grid>
                    <Grid item xs={2} sx={{"backgroundColor": "#E6E9F1"}}>
                        <DialogActions>
                            <IconButton aria-label="close"
                                        onClick={handlePreviewClose}><CloseIcon/></IconButton>
                        </DialogActions>
                    </Grid>
                </Grid>
                <DialogContent sx={{
                    "backgroundColor": "#E6E9F1",
                    "padding-top": "0px",
                    "padding-left": "24px",
                    "padding-right": "24px",
                    "padding-bottom": "64px",
                    "overflow": "hidden"
                }}>
                    <Grid container spacing={"2"}>
                        <Grid item xs={8}
                              sx={{"backgroundColor": "#FFFFFF", "border": "16px solid #C0C7DE"}}>
                            <video
                                src={props.videoURL}
                                width="100%"
                                height="100%"
                                controls
                            />
                        </Grid>
                        <Grid item xs={4} sx={{
                            "padding-left": "16px",
                            "backgroundColor": "#FFFFFF",
                            "border-top": "16px solid #C0C7DE",
                            "border-right": "16px solid #C0C7DE",
                            "border-bottom": "16px solid #C0C7DE",
                            "border-left": "0px solid #C0C7DE"
                        }}>
                            <Grid container spacing={2} sx={{"padding": "16px"}}>
                                <Grid item xs={12} sx={{
                                    "font": "Arial",
                                    "font-size": "28px",
                                    "font-weight": "bold",
                                    "padding-bottom": "16px"
                                }}>
                                    <div>{props.title}</div>
                                </Grid>
                                <Grid item xs={12} sx={{"font": "Arial", "padding-left": "16px"}}>
                                    {props.markdownContent && props.markdownContent.split('\n').map((line, _) => ( // eslint-disable-line @typescript-eslint/no-unused-vars
                                        <div>{line}</div>
                                    ))}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>
            </Dialog>
        </div>
    )
}
