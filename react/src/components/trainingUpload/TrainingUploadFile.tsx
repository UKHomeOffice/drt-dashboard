import React, {useState} from 'react';
import {MarkdownEditor} from './MarkdownEditor';
import axios, {AxiosResponse} from "axios";

const UploadForm: React.FC = () => {
    const [video, setVideo] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [markdownContent, setMarkdownContent] = useState('');
    const [uploaded, setUploaded] = useState(false);
    const [error, setError] = useState(false);

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
        if(response.status === 200) {
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
        axios.post('/training/uploadVideo', formData)
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
        error ? <div style={{marginTop: '20px' , color:'red'}}> Error uploading file <br/>
            <button style={{marginTop: '20px'}} onClick={() => setError(false)}>Back</button> </div> :
        uploaded ? <div style={{marginTop: '20px'}}> File Uploaded Successfully <br/>
                <button style={{marginTop: '20px'}} onClick={() => setUploaded(false)}>Upload another file</button> </div> :
        <form onSubmit={handleSubmit}>
            <h1>Training Content form</h1>
            <div style={{marginTop: '20px'}}>
                <label htmlFor="image">Training video file : </label>
                <input type="file" id="webmFile" accept="File/*" onChange={handleImageChange}/>
            </div>
            <div style={{marginTop: '20px'}}>
                <label htmlFor="text">Title : </label>
                <input id="text" value={text} onChange={handleInputChange}/>
            </div>
            <div style={{marginTop: '20px'}}>
                <label htmlFor="markdown">Markdown:</label>
                <MarkdownEditor
                    markdownContent={markdownContent}
                    handleMarkdownChange={handleMarkdownChange}
                />
            </div>
            <button type="submit">Submit</button>
        </form>
    );
};

export default UploadForm;
