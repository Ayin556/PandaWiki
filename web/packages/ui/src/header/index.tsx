'use client';
import React, { useState, useEffect } from 'react';
import { IconSousuo, IconZhinengwenda } from '@panda-wiki/icons';
import { Box, Button, IconButton, Stack, TextField, Link } from '@mui/material';
import NavBtns, { NavBtn } from './NavBtns';
import { DocWidth } from '../constants';

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
        sx={{
          transition: 'left 0.2s ease-in-out',
          position: 'sticky',
          zIndex: 10,
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          bgcolor: 'background.default',
          borderBottom: '1px solid',
          borderColor: 'divider',
          ...(mobile && {
            left: 0,
          }),
          pl: mobile ? 3 : 5,
          pr: mobile ? 1.5 : 5,
        }}
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
                py: '20px',
                cursor: 'pointer',
                color: 'text.primary',
                '&:hover': { color: 'primary.main' },
              }}
            >
              <img src={logo} alt='logo' width={32} />
              <Box sx={{ fontSize: 18 }}>{title}</Box>
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
                sx={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  maxWidth: '600px',
                  bgcolor: 'background.paper3',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  '& .MuiInputBase-input': {
                    fontSize: 14,
                    lineHeight: '19.5px',
                    height: '19.5px',
                    fontFamily: 'Mono',
                    cursor: 'pointer',
                    py: '10.5px',
                    pl: 1,
                  },
                  '& .MuiOutlinedInput-root': {
                    pr: '12px',
                    pl: '12px',
                    '& fieldset': {
                      borderRadius: '10px',
                      borderColor: 'transparent',
                    },
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
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
                          ⌘K
                        </Box>
                        <Button
                          variant='contained'
                          // @ts-ignore
                          color='light'
                          startIcon={
                            <IconZhinengwenda
                              sx={{
                                width: 16,
                                height: 16,
                                fontSize: 12,
                                color: 'primary.main',
                              }}
                            ></IconZhinengwenda>
                          }
                          sx={{
                            textTransform: 'none',
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5,
                            fontSize: 12,
                          }}
                        >
                          智能问答
                        </Button>
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
                    sx={{ textTransform: 'none' }}
                  >
                    <Box sx={{ lineHeight: '24px' }}>{item.text}</Box>
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
