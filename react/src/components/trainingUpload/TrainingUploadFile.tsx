import React, {useState} from 'react';
import {MarkdownEditor} from './MarkdownEditor';

const UploadForm: React.FC = () => {
    const [video, setVideo] = useState<File | null>(null);
    const [text, setText] = useState('');
    const [markdownContent, setMarkdownContent] = useState('');

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


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Here you can perform the upload logic using a library or making an API call

        // Example API call with FormData
        const formData = new FormData();
        formData.append('webmFile', video);
        formData.append('title', text);
        formData.append('markdownContent', markdownContent);
        fetch('/training/upload', {
            method: 'POST',
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                // Handle the response data
                console.log(data);
            })
            .catch(error => {
                // Handle errors
                console.error(error);
            });
    };

    return (
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
