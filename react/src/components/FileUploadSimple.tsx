import axios from 'axios';
import React, {Component} from 'react';
import UserLike from "../model/User";

interface IProps {
    user: UserLike;
}

interface IState {
    selectedFile: any;
    fileInput: any;
    displayMessage: string;

}

class FileUploadSimple extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            // Initially, no file is selected
            selectedFile: null,
            fileInput: React.createRef(),
            displayMessage: 'Choose before Pressing the Upload button'
        };
    }

    // On file select (from the pop up)
    onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        // Update the state
        if (event.target.files && event.target.files.length > 0) {
            this.setState({selectedFile: event.target.files[0]});
        }

    };

    // On file upload (click the upload button)
    onFileUpload = () => {

        if (this.state.selectedFile) {
            const formData = new FormData();
            formData.append(
                this.props.user.email,
                this.state.selectedFile,
                this.state.selectedFile.name
            );
            console.log(this.state.selectedFile);
            axios.post("api/uploadfile", formData);
            this.setState({displayMessage: this.state.selectedFile.name + ' ,file uploaded please upload new file'});
            this.state.fileInput.current.value = '';
            this.setState({selectedFile: null});
        }

    };

    // File content to be displayed after
    // file upload is complete
    fileData = () => {
        if (this.state.selectedFile) {
            return (
                <div>
                    <h2>File Details:</h2>
                    <p>File Name: {this.state.selectedFile.name}</p>
                    <p>File Type: {this.state.selectedFile.type}</p>
                    <p>
                        Last Modified:{" "}
                        {this.state.selectedFile.lastModifiedDate.toDateString()}
                    </p>

                </div>
            );
        } else {
            return (
                <div>
                    <br/>
                    <h4>{this.state.displayMessage}</h4>
                </div>
            );
        }
    };

    render() {
        return (
            <div>
                <h1>
                    File Upload
                </h1>
                <h3>
                    Please upload nebo CSV file
                </h3>
                <div>
                    <input type="file" onChange={this.onFileChange} id="fileInputId" ref={this.state.fileInput}/>
                    <button onClick={this.onFileUpload}>
                        Upload!
                    </button>
                </div>
                {this.fileData()}
            </div>
        );
    }
}

export default FileUploadSimple;