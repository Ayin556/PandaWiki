'use client';
import { createTheme } from '@mui/material';
import { zhCN } from '@mui/material/locale';
import { zhCN as CuiZhCN } from 'ct-mui/dist/local';

const lightTheme = createTheme(
  {
    cssVariables: true,
    palette: {
      mode: 'light',
      primary: {
        main: '#556AFF',
      },
      error: {
        main: '#F64E54',
      },
      success: {
        main: '#00DF98',
      },
      disabled: {
        main: '#666',
      },
      dark: {
        dark: '#000',
        main: '#14141B',
        light: '#20232A',
        contrastText: '#fff',
      },
      light: {
        main: '#fff',
        contrastText: '#000',
      },
      background: {
        default: '#fff',
        paper: '#F8F9FA',
      },
      text: {
        primary: '#21222D',
        secondary: 'rgba(33,34,45, 0.7)',
        tertiary: 'rgba(33,34,45, 0.5)',
        disabled: 'rgba(33,34,45, 0.3)',
      },
      divider: '#ECEEF1',
    },

    components: {
      MuiInputBase: {
        styleOverrides: {
          root: {
            backgroundColor: 'background.default',
            fontFamily: 'var(--font-gilory), var(--font-puhuiti)',
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: 'transparent',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#21222D !important',
              borderWidth: '1px !important',
            },
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            fontSize: '1em',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-gilory), var(--font-puhuiti)',
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-gilory), var(--font-puhuiti)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-gilory), var(--font-puhuiti)',
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-gilory), var(--font-puhuiti)',
          },
          asterisk: {
            color: '#F64E54',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-gilory), var(--font-puhuiti)',
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '6px',
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            textDecoration: 'none',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: '#eee',
            paddingLeft: '24px !important',
          },
          head: {
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
            height: '40px',
            backgroundColor: '#F5F5F8',
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            padding: '24px',
            borderRadius: '10px !important',
            border: '1px solid',
            backgroundColor: 'var(--mui-palette-background-paper)',
            borderColor: 'var(--mui-palette-divider)',
            boxShadow: 'none',
            '&.Mui-expanded': {
              margin: 0,
            },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            margin: 0,
            padding: 0,
            paddingBottom: '8px',
            minHeight: '0 !important',
            '&.Mui-expanded': {
              minHeight: 0,
            },
            '&:before': {
              display: 'none',
            }
          },
          content: {
            margin: 0,
            fontSize: 20,
            lineHeight: '28px',
            '&.Mui-expanded': {
              margin: 0,
            },
          }
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            borderTop: '1px solid',
            borderColor: 'var(--mui-palette-divider)',
            padding: 0,
            paddingTop: '24px',
          }
        }
      }
    },
  },
  zhCN,
  CuiZhCN
);

export { lightTheme };
