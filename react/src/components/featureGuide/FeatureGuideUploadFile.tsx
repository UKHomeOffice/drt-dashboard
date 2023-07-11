import React, {useState} from 'react';
import {MarkdownEditor} from './MarkdownEditor';
import axios, {AxiosResponse} from "axios";
import ListFeatureGuide from "./ListFeatureGuide";
import {PreviewComponent} from "./PreviewComponent";

const UploadForm: React.FC = () => {
    const [video, setVideo] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [markdownContent, setMarkdownContent] = useState('');
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);
    const [viewFeatureGuides, setViewFeatureGuides] = useState(false);
    const handlePreviewOpen = () => setOpenPreview(true);

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
                viewFeatureGuides ? <ListFeatureGuide setViewFeatureGuides={setViewFeatureGuides}/> :
                    <div>
                        <form onSubmit={handleSubmit}>
                            <h1>New Feature Guide | <a href = "#" style={{marginTop: '20px'}} onClick={() => setViewFeatureGuides(true)}>View Feature list</a> </h1>
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
                        {markdownContent.length > 0 ?
                        <button style={{marginLeft: "240px"}} onClick={handlePreviewOpen}>Preview
                        </button> : <span/>}

                        <PreviewComponent videoURL={video ? URL.createObjectURL(video) : ""} title={text} markdownContent={markdownContent} openPreview={openPreview}
                                          setOpenPreview={setOpenPreview}/>
                    </div>

    );
};

export default UploadForm;
