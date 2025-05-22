'use client';
import { createTheme } from '@mui/material';
import { zhCN } from '@mui/material/locale';
import { zhCN as CuiZhCN } from 'ct-mui/dist/local';

const darkTheme = createTheme(
  {
    cssVariables: true,
    palette: {
      mode: 'dark',
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
      background: {
        default: '#14141B',
        paper: '#21222D',
      },
      light: {
        main: '#fff',
        contrastText: '#000',
      },
      text: {
        primary: '#fff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        tertiary: 'rgba(255, 255, 255, 0.5)',
        disabled: 'rgba(255, 255, 255, 0.2)',
      },
    },

    components: {
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: '#21222D',
          },
          arrow: {
            color: '#21222D',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontFamily: 'var(--font-gilory), var(--font-puhuiti)',
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#fff !important',
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
    },
  },
  zhCN,
  CuiZhCN
);

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
        disabled: 'rgba(33,34,45, 0.2)',
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
    },
  },
  zhCN,
  CuiZhCN
);

export { darkTheme, lightTheme };
