import {createTheme} from '@mui/material/styles';

const drtTheme = createTheme({
  palette: {
    primary: {
      main: '#005ea5',
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
      fontSize: '18px',
      fontWeight: "bold",
      textTransform: 'none',
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 400,
          fontSize: '16px',
          padding: '6px 12px',
        }
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          margin: '0 !important'
        }
      }
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          minHeight: 'unset !important',
        },
        content: {
          margin: '12px 0 0 !important'
        }
      }
    }
  },


});

export default drtTheme;
