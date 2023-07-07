import React, {useState} from 'react';
import {MarkdownEditor} from './MarkdownEditor';
import axios, {AxiosResponse} from "axios";
import {Dialog, DialogActions, DialogContent, DialogTitle} from "@mui/material";
import Grid from "@mui/material/Grid";
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const UploadForm: React.FC = () => {
    const [video, setVideo] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [markdownContent, setMarkdownContent] = useState('');
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);

    const handlePreviewOpen = () => setOpenPreview(true);
    const handlePreviewClose = () => setOpenPreview(false);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setVideo(e.target.files[0]);
        }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setText(event.target.value);
    };

    const handleMarkdownChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMarkdownContent(event.target.value);
    };

    const handleResponse = (response: AxiosResponse) => {
        if (response.status === 200) {
            setUploaded(true);
            response.data
        } else {
            setError(true);
            response.data
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('webmFile', video);
        formData.append('title', text);
        formData.append('markdownContent', markdownContent);
        axios.post('/guide/uploadFeatureGuide', formData)
            .then(response => handleResponse(response))
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                setError(true);
                console.error(error);
            });
    };

    return (
        error ? <div style={{marginTop: '20px', color: 'red'}}> There was a problem saving the feature guide <br/>
                <button style={{marginTop: '20px'}} onClick={() => setError(false)}>Back</button>
            </div> :
            uploaded ? <div style={{marginTop: '20px'}}> New feature guide successfully saved <br/>
                    <button style={{marginTop: '20px'}} onClick={() => setUploaded(false)}>Upload another file</button>
                </div> :
                <div>
                    <form onSubmit={handleSubmit}>
                        <h1>New Feature Guide</h1>
                        <div style={{marginTop: '20px'}}>
                            <label htmlFor="image">Feature demo video (webm format) : </label>
                            <input type="file" id="webmFile" accept="File/*" onChange={handleImageChange}/>
                        </div>
                        <div style={{marginTop: '20px'}}>
                            <label htmlFor="text">Title </label>
                            <input id="text" value={text} onChange={handleInputChange}/>
                        </div>
                        <div style={{marginTop: '20px', font: "Arial", fontSize: "16px"}}>
                            <label htmlFor="markdown">Markdown:</label>
                            <MarkdownEditor
                                markdownContent={markdownContent}
                                handleMarkdownChange={handleMarkdownChange}
                            />
                        </div>
                        <button type="submit">Submit</button>
                    </form>
                    <button style={{marginLeft: "240px"}} onClick={handlePreviewOpen}>Preview
                    </button>
                    <Dialog open={openPreview} maxWidth="lg" fullWidth="true" onClose={handlePreviewClose}>
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
                                <Grid item xs={8} sx={{"backgroundColor": "#FFFFFF", "border": "16px solid #C0C7DE"}}>
                                    <video
                                        src={video}
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
                                            <div>{text}</div>
                                        </Grid>
                                        <Grid item xs={12} sx={{"font": "Arial", "padding-left": "16px"}}>
                                            {markdownContent.split('\n').map((line, _) => ( // eslint-disable-line @typescript-eslint/no-unused-vars
                                                <div>{line}</div>
                                            ))}
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </DialogContent>
                    </Dialog>
                </div>

    );
};

export default UploadForm;
