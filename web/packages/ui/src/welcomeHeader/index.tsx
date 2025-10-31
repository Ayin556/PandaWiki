'use client';
import React, { useEffect, useState } from 'react';
import { IconSousuo } from '@panda-wiki/icons';
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Link,
  alpha,
  styled,
  lighten,
} from '@mui/material';
import NavBtns, { NavBtn } from './NavBtns';
import { DocWidth } from '../constants';

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  padding: '2px 12px',
  fontSize: 12,
  borderRadius: '6px',
  boxShadow: '0px 1px 2px 0px rgba(145,158,171,0.16)',
  backgroundColor: theme.palette.background.default,
}));

// 检测平台类型
const isMac = () => /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const getKeyboardShortcut = () =>
  typeof navigator !== 'undefined' ? (isMac() ? '⌘K' : 'Ctrl+K') : '';

interface SearchSuggestion {
  id: string;
  title: string;
  description?: string;
  type?: 'recent' | 'suggestion' | 'trending';
}

interface HeaderProps {
  isDocPage?: boolean;
  mobile?: boolean;
  docWidth?: string;
  catalogWidth?: number;
  logo?: string;
  placeholder?: string;
  title?: string;
  showSearch?: boolean;
  onSearch?: (value?: string, type?: 'search' | 'chat') => void;
  onSearchSuggestions?: (query: string) => Promise<SearchSuggestion[]>;
  btns?: NavBtn[];
  children?: React.ReactNode;
  onQaClick?: () => void;
}
const Header = React.memo(
  ({
    isDocPage = false,
    mobile = false,
    docWidth = 'full',
    catalogWidth = 0,
    logo = '',
    placeholder = '搜索',
    title,
    showSearch = true,
    onSearch,
    onSearchSuggestions,
    btns,
    children,
    onQaClick,
  }: HeaderProps) => {
    const [ctrlKShortcut, setCtrlKShortcut] = useState('');
    useEffect(() => {
      setCtrlKShortcut(getKeyboardShortcut());
    }, []);

    const [isAtTop, setIsAtTop] = useState(true);
    useEffect(() => {
      const handleScroll = () => {
        setIsAtTop(window.scrollY <= 0);
      };
      handleScroll();
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 全局键盘事件监听：⌘K (Mac) 或 Ctrl+K (Windows/Linux)
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Mac: Command + K, Windows/Linux: Ctrl + K
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault();
          onQaClick?.();
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }, []);

    return (
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='center'
        sx={theme => ({
          transition: 'left 0.2s ease-in-out',
          position: 'sticky',
          zIndex: 10,
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          backgroundColor: isAtTop
            ? 'transparent'
            : theme.palette.background.default,
          boxShadow: isAtTop
            ? 'none'
            : `0 2px 8px 0px ${alpha(theme.palette.text.primary, 0.1)}`,
          ...(mobile && {
            left: 0,
          }),
          pl: mobile ? 3 : 5,
          pr: mobile ? 1.5 : 5,
        })}
      >
        <Stack
          direction='row'
          alignItems='center'
          gap={2}
          justifyContent='space-between'
          sx={{
            position: 'relative',
            width: '100%',
            ...(isDocPage &&
              !mobile &&
              docWidth !== 'full' && {
                width: `calc(${DocWidth[docWidth as keyof typeof DocWidth].value}px + ${catalogWidth}px + 192px + 240px)`,
              }),
          }}
        >
          <Link href={'/'}>
            <Stack
              direction='row'
              alignItems='center'
              gap={1.5}
              sx={{
                cursor: 'pointer',
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <img src={logo} alt='logo' height={36} />
              <Box sx={{ fontSize: 20 }}>{title}</Box>
            </Stack>
          </Link>
          {showSearch &&
            (mobile ? (
              // 移动端：显示搜索图标按钮
              <Stack
                direction='row'
                alignItems='center'
                justifyContent='flex-end'
                sx={{ flex: 1 }}
              >
                <IconButton
                  size='small'
                  sx={{ width: 40, height: 40, color: 'text.primary' }}
                  onClick={() => onQaClick?.()}
                >
                  <IconSousuo sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>
            ) : (
              // 桌面端：显示搜索框
              <TextField
                placeholder={placeholder}
                fullWidth
                focused={false}
                onClick={() => onQaClick?.()}
                sx={theme => ({
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: '500px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '.MuiOutlinedInput-input': {
                    py: 1,
                  },
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    pr: '12px',
                    pl: '12px',
                    '& fieldset': {
                      borderRadius: '10px',
                      borderColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                })}
                slotProps={{
                  input: {
                    readOnly: true,
                    startAdornment: (
                      <IconSousuo
                        sx={{
                          cursor: 'pointer',
                          color: 'text.tertiary',
                          fontSize: 20,
                          mr: 1,
                        }}
                      />
                    ),
                    endAdornment: (
                      <Stack
                        direction='row'
                        alignItems='center'
                        gap={1.5}
                        sx={{ flexShrink: 0 }}
                      >
                        <Box
                          sx={{
                            fontSize: 12,
                            color: 'text.tertiary',
                          }}
                        >
                          {ctrlKShortcut}
                        </Box>
                        <StyledButton
                          variant='contained'
                          // @ts-ignore
                          color='light'
                          sx={{}}
                        >
                          智能问答
                        </StyledButton>
                      </Stack>
                    ),
                  },
                }}
              />
            ))}

          {!mobile && (
            <Stack direction='row' gap={2} alignItems='center'>
              {btns?.map((item, index) => (
                <Link key={index} href={item.url} target={item.target}>
                  <Button
                    variant={item.variant}
                    sx={theme => ({
                      px: 3.5,
                      textTransform: 'none',
                      boxSizing: 'border-box',
                      height: 40,
                      ...(item.variant === 'outlined' && {
                        borderWidth: 2,
                        bgcolor: theme.palette.background.default,
                        borderColor: alpha(theme.palette.primary.main, 0.8),
                        '&:hover': {
                          borderColor: theme.palette.primary.main,
                        },
                      }),
                    })}
                    startIcon={
                      item.showIcon && item.icon ? (
                        <img
                          src={item.icon}
                          alt='logo'
                          width={24}
                          height={24}
                        />
                      ) : null
                    }
                  >
                    <Box sx={{ lineHeight: '24px', fontSize: 18 }}>
                      {item.text}
                    </Box>
                  </Button>
                </Link>
              ))}
            </Stack>
          )}
          {mobile && <NavBtns logo={logo} title={title} btns={btns} />}
        </Stack>
        {children}
      </Stack>
    );
  },
);

export default Header;
