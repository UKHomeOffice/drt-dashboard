import React from 'react';
import './index.css';
import {App} from './App';
import {BrowserRouter} from "react-router-dom";
import {AdapterMoment} from '@mui/x-date-pickers/AdapterMoment';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import * as serviceWorker from './serviceWorker';
import {StyledEngineProvider} from '@mui/material/styles';
import {createRoot} from 'react-dom/client';


const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"/>
    <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"/>
    <StyledEngineProvider injectFirst>
      <BrowserRouter>
        <LocalizationProvider dateAdapter={AdapterMoment}>
            <StyledEngineProvider injectFirst>
                <App/>
            </StyledEngineProvider>
        </LocalizationProvider>
      </BrowserRouter>
    </StyledEngineProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
