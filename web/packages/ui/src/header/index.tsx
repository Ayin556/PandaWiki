'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconSousuo, IconXingxing } from '@panda-wiki/icons';
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Link,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  CircularProgress,
  Modal,
} from '@mui/material';
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
  }: HeaderProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [anchorElWidth, setAnchorElWidth] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // 防抖搜索
    const debouncedSearch = useCallback(
      (query: string) => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(async () => {
          if (query.trim() && onSearchSuggestions) {
            setIsLoading(true);
            try {
              const results = await onSearchSuggestions(query);
              setSuggestions(results);
            } catch (error) {
              console.error('搜索建议获取失败:', error);
              setSuggestions([]);
            } finally {
              setIsLoading(false);
            }
          } else {
            setSuggestions([]);
          }
        }, 300);
      },
      [onSearchSuggestions],
    );

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);
      setSelectedIndex(-1);

      if (value.trim()) {
        debouncedSearch(value);
        if (onSearch) {
          setAnchorEl(e.currentTarget.parentElement);
          setAnchorElWidth(e.currentTarget.parentElement?.offsetWidth || 0);
        }
      } else {
        setSuggestions([]);
        setAnchorEl(null);
      }
    };

    // 处理键盘事件
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleMobileSearchClose();
        onSearch?.(searchValue, 'chat');
        setAnchorEl(null);
        setSelectedIndex(-1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Escape') {
        setAnchorEl(null);
        setSelectedIndex(-1);
      }
    };

    // 处理建议项点击
    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
      setSearchValue(suggestion.title);
      onSearch?.(suggestion.title);
      setAnchorEl(null);
      setSelectedIndex(-1);
    };

    // 处理输入框聚焦
    const handleInputFocus = (e: React.FocusEvent) => {
      setIsInputFocused(true);
      if (searchValue.trim()) {
        setAnchorEl(e.currentTarget.parentElement);
        setAnchorElWidth(e.currentTarget.parentElement?.offsetWidth || 0);
      }
    };

    // 处理输入框失焦
    const handleInputBlur = (e: React.FocusEvent) => {
      // 检查焦点是否移到了 Popper 内部
      const relatedTarget = e.relatedTarget as HTMLElement;
      const isFocusInPopper =
        relatedTarget &&
        (relatedTarget.closest('.MuiPopper-root') ||
          relatedTarget.closest('[role="listbox"]'));

      if (!isFocusInPopper) {
        // 延迟关闭，允许点击建议项
        setTimeout(() => {
          setAnchorEl(null);
          setSelectedIndex(-1);
          setIsInputFocused(false);
        }, 200);
      }
    };

    // 处理点击外部关闭下拉框
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (anchorEl && !anchorEl.contains(event.target as Node)) {
          const popperElement = document.querySelector('.MuiPopper-root');
          if (popperElement && !popperElement.contains(event.target as Node)) {
            setAnchorEl(null);
            setSelectedIndex(-1);
          }
        }
      };

      if (anchorEl) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [anchorEl]);

    // 处理移动端搜索弹窗关闭（清空搜索内容）
    const handleMobileSearchClose = () => {
      setMobileSearchOpen(false);
      setSearchValue('');
      setSuggestions([]);
      setSelectedIndex(-1);
    };

    // 处理移动端搜索执行（关闭弹窗但保留搜索值）
    const handleMobileSearchExecute = (type: 'search' | 'chat') => {
      onSearch?.(searchValue, type);
      handleMobileSearchClose();
    };

    // 清理定时器
    useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
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
                  onClick={() => setMobileSearchOpen(true)}
                >
                  <IconSousuo sx={{ fontSize: 20 }} />
                </IconButton>
              </Stack>
            ) : (
              // 桌面端：显示搜索框
              <>
                <TextField
                  ref={inputRef}
                  size='small'
                  value={searchValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  placeholder={placeholder}
                  fullWidth
                  sx={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth: '400px',
                    bgcolor: 'background.default',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    '& .MuiInputBase-input': {
                      fontSize: 14,
                      lineHeight: '19.5px',
                      height: '19.5px',
                      fontFamily: 'Mono',
                    },
                    '& .MuiOutlinedInput-root': {
                      pr: '18px',
                      '& fieldset': {
                        borderRadius: '10px',
                        borderColor: 'divider',
                        px: 2,
                      },
                    },
                  }}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <IconSousuo
                          onClick={() => onSearch?.(searchValue, 'chat')}
                          sx={{
                            cursor: 'pointer',
                            color: 'text.tertiary',
                            fontSize: 16,
                          }}
                        />
                      ),
                    },
                  }}
                />

                {/* 搜索建议下拉框 */}
                <Popper
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  placement='bottom-start'
                  sx={{
                    zIndex: 1300,
                    width: anchorElWidth,
                    '& .MuiPopper-root': {
                      width: '100%',
                    },
                  }}
                >
                  <Paper
                    elevation={8}
                    sx={{
                      width: '100%',
                      maxHeight: 300,
                      mt: 1,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                    onMouseDown={(e: React.MouseEvent) => {
                      // 阻止事件冒泡，避免关闭 Popper
                      e.stopPropagation();
                    }}
                  >
                    {isLoading ? (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <CircularProgress size={20} />
                        <Typography
                          variant='body2'
                          sx={{ mt: 1, color: 'text.secondary' }}
                        >
                          搜索中...
                        </Typography>
                      </Box>
                    ) : suggestions.length > 0 ? (
                      <List sx={{ p: 0 }}>
                        {suggestions.map((suggestion, index) => (
                          <ListItem key={suggestion.id} disablePadding>
                            <ListItemButton
                              selected={index === selectedIndex}
                              onClick={() => handleSuggestionClick(suggestion)}
                              sx={{
                                '&.Mui-selected': {
                                  backgroundColor: 'primary.main',
                                  color: 'primary.contrastText',
                                  '&:hover': {
                                    backgroundColor: 'primary.dark',
                                  },
                                },
                                '&:hover': {
                                  backgroundColor: 'action.hover',
                                },
                              }}
                            >
                              <ListItemText
                                primary={suggestion.title}
                                secondary={suggestion.description}
                                primaryTypographyProps={{
                                  sx: {
                                    fontWeight:
                                      index === selectedIndex ? 600 : 400,
                                  },
                                }}
                                secondaryTypographyProps={{
                                  sx: {
                                    fontSize: '0.75rem',
                                    color:
                                      index === selectedIndex
                                        ? 'inherit'
                                        : 'text.secondary',
                                  },
                                }}
                              />
                              {suggestion.type && (
                                <Typography
                                  variant='caption'
                                  sx={{
                                    color:
                                      suggestion.type === 'recent'
                                        ? 'text.secondary'
                                        : 'primary.main',
                                    fontSize: '0.7rem',
                                    ml: 1,
                                  }}
                                >
                                  {suggestion.type === 'recent'
                                    ? '最近搜索'
                                    : suggestion.type === 'trending'
                                      ? '热门'
                                      : '建议'}
                                </Typography>
                              )}
                            </ListItemButton>
                          </ListItem>
                        ))}
                      </List>
                    ) : null}
                    <Stack direction='row' gap={2} sx={{ p: 2 }}>
                      <Button
                        variant='outlined'
                        color='primary'
                        onClick={() => onSearch?.(searchValue, 'chat')}
                      >
                        <IconXingxing sx={{ mr: 0.5 }} />
                        智能问答
                      </Button>
                      <Button
                        variant='outlined'
                        color='primary'
                        onClick={() => onSearch?.(searchValue, 'search')}
                      >
                        全站搜索
                      </Button>
                    </Stack>
                  </Paper>
                </Popper>
              </>
            ))}

          {/* 移动端搜索弹窗 */}
          {mobile && (
            <Modal
              open={mobileSearchOpen}
              onClose={handleMobileSearchClose}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                pt: 2,
              }}
              slotProps={{
                backdrop: {
                  sx: {
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                  },
                },
              }}
            >
              <Paper
                sx={{
                  width: 'calc(100% - 32px)',
                  maxWidth: 600,
                  m: 2,
                  p: 2,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: 24,
                  outline: 'none',
                }}
                onClick={e => e.stopPropagation()}
              >
                <Stack spacing={2}>
                  {/* 搜索框 */}
                  <TextField
                    ref={inputRef}
                    size='small'
                    value={searchValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus
                    fullWidth
                    sx={{
                      bgcolor: 'background.default',
                      borderRadius: '10px',
                      '& .MuiInputBase-input': {
                        fontSize: 14,
                        lineHeight: '19.5px',
                        height: '19.5px',
                        fontFamily: 'Mono',
                      },
                      '& .MuiOutlinedInput-root': {
                        pr: '18px',
                        '& fieldset': {
                          borderRadius: '10px',
                          borderColor: 'divider',
                          px: 2,
                        },
                      },
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <IconSousuo
                            onClick={() => handleMobileSearchExecute('chat')}
                            sx={{
                              cursor: 'pointer',
                              color: 'text.tertiary',
                              fontSize: 16,
                            }}
                          />
                        ),
                      },
                    }}
                  />

                  {/* 搜索建议列表 */}
                  {isLoading ? (
                    <Box sx={{ py: 2, textAlign: 'center' }}>
                      <CircularProgress size={20} />
                      <Typography
                        variant='body2'
                        sx={{ mt: 1, color: 'text.secondary' }}
                      >
                        搜索中...
                      </Typography>
                    </Box>
                  ) : suggestions.length > 0 ? (
                    <List sx={{ p: 0, maxHeight: 200, overflow: 'auto' }}>
                      {suggestions.map((suggestion, index) => (
                        <ListItem key={suggestion.id} disablePadding>
                          <ListItemButton
                            selected={index === selectedIndex}
                            onClick={() => {
                              setSearchValue(suggestion.title);
                              handleMobileSearchExecute('search');
                            }}
                            sx={{
                              '&.Mui-selected': {
                                backgroundColor: 'primary.main',
                                color: 'primary.contrastText',
                                '&:hover': {
                                  backgroundColor: 'primary.dark',
                                },
                              },
                              '&:hover': {
                                backgroundColor: 'action.hover',
                              },
                            }}
                          >
                            <ListItemText
                              primary={suggestion.title}
                              secondary={suggestion.description}
                              primaryTypographyProps={{
                                sx: {
                                  fontWeight:
                                    index === selectedIndex ? 600 : 400,
                                },
                              }}
                              secondaryTypographyProps={{
                                sx: {
                                  fontSize: '0.75rem',
                                  color:
                                    index === selectedIndex
                                      ? 'inherit'
                                      : 'text.secondary',
                                },
                              }}
                            />
                            {suggestion.type && (
                              <Typography
                                variant='caption'
                                sx={{
                                  color:
                                    suggestion.type === 'recent'
                                      ? 'text.secondary'
                                      : 'primary.main',
                                  fontSize: '0.7rem',
                                  ml: 1,
                                }}
                              >
                                {suggestion.type === 'recent'
                                  ? '最近搜索'
                                  : suggestion.type === 'trending'
                                    ? '热门'
                                    : '建议'}
                              </Typography>
                            )}
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  ) : null}

                  {/* 智能问答和全站搜索按钮 */}
                  {searchValue.trim() && (
                    <Stack direction='row' gap={2}>
                      <Button
                        variant='outlined'
                        color='primary'
                        fullWidth
                        onClick={() => handleMobileSearchExecute('chat')}
                      >
                        <IconXingxing sx={{ mr: 0.5, fontSize: 18 }} />
                        智能问答
                      </Button>
                      <Button
                        variant='outlined'
                        color='primary'
                        fullWidth
                        onClick={() => handleMobileSearchExecute('search')}
                      >
                        全站搜索
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Modal>
          )}

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
