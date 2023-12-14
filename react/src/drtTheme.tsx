import {createTheme} from '@mui/material/styles';

const drtTheme = createTheme({
  palette: {
    primary: {
      main: '#233E82',
    },
  },
  typography: {
    h1: {
      fontSize: '46px',
      fontWeight: 'bold',
    },
    h2: {
      fontSize: '40px',
      fontWeight: 'bold',
    },
    h3: {
      fontSize: "28px",
      fontWeight: "bold",
    },
    h4: {
      fontSize: "24px",
      fontWeight: "bold",
    },
    h5: {
      fontSize: "18px",
      fontWeight: "bold",
    },
    subtitle1: {
      fontSize: "19px",
      fontWeight: "bold",
    },
    subtitle2: {
      fontSize: "16px",
      fontWeight: "bold",
    },
    body1: {
      fontSize: "14px",
    },
    body2: {
      fontSize: "12px",
    },
    button: {
      fontSize: '1.25rem',
      fontWeight: "bold",
    },
  }


});

export default drtTheme;
