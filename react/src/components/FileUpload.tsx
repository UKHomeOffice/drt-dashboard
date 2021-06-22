import React, {Component} from 'react';
import UserLike from "../model/User";
import ApiClient from "../services/ApiClient";
import axios, {AxiosRequestConfig, AxiosResponse} from "axios";
interface IProps {
    user: UserLike;
}

interface IState {
    selectedFile: any;
    fileInput: any;
    displayMessage: string;
    hasError: boolean;
    errorMessage: string;

}

class FileUpload extends React.Component<IProps, IState> {

    constructor(props: IProps) {
        super(props);
        this.state = {
            // Initially, no file is selected
            selectedFile: null,
            fileInput: React.createRef(),
            displayMessage: 'Choose before Pressing the Upload button',
            hasError: false,
            errorMessage: ''
        };
    }

    // On file select (from the pop up)
    onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            this.setState({selectedFile: event.target.files[0]});
        }
    };

    // On file upload (click the upload button)
    onFileUpload = () => {
        const apiClient = new ApiClient;
        if (this.state.selectedFile) {
            const formData = new FormData();
            formData.append(
                "csv",
                this.state.selectedFile,
                this.state.selectedFile.name
            );
            this.postUploadData("/uploadFile",formData,this.responseData);
            if(this.state.hasError) {
                this.setState({displayMessage: this.state.selectedFile.name + ' file is unable to process. Please try again later or contact us.'});
            } else{
                this.setState({displayMessage: this.state.selectedFile.name + ' file is processed . You can upload new file .'});
            }
            this.setState({hasError:false});
            this.setState({selectedFile: null});
            this.state.fileInput.current.value = '';
        }

    };

    public reqConfig: AxiosRequestConfig = {
        headers: {'Access-Control-Allow-Origin': '*'}
    };

    public postUploadData(endPoint: string,data: any, handleResponse: (r: AxiosResponse) => void) {
        let fileName = this.state.selectedFile.name ;
        axios
            .post(endPoint, data, this.reqConfig)
            .then(response => handleResponse(response))
            .catch(t => this.setState(() => ({hasError: true, errorMessage: t ,displayMessage: fileName + ' file is unable to process. Please try again later or contact us.'})))
    }

    responseData = (response: AxiosResponse) => {
        console.log('response from post ' + response)
    }


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
                    <br/>
                    <br/>
                <h3>
                    Please upload nebo CSV file
                </h3>
                <div>
                    <br/>
                    <br/>
                    <input type="file" onChange={this.onFileChange} id="fileInputId" ref={this.state.fileInput}/>
                    <br/>
                    <br/>
                    <br/>
                    <button onClick={this.onFileUpload}>
                        Upload!
                    </button>
                </div>
                {this.fileData()}
            </div>
        );
    }
}

export default FileUpload;