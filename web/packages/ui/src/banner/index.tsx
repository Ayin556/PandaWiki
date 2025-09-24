'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconXingxing } from '@panda-wiki/icons';
import {
  ButtonProps,
  styled,
  TextField,
  Button,
  Stack,
  Box,
  InputAdornment,
  Popper,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  CircularProgress,
} from '@mui/material';
import { StyledTopicBox } from '../component/styledCommon';
import { IconFasong } from '@panda-wiki/icons';

const StyledBanner = styled('div')(({ theme }) => ({
  margin: theme.spacing(0, 2),
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '20px',
  backgroundColor: '#21212d',
}));

const StyledTitle = styled('h1')(({ theme }) => ({
  fontSize: 36,
  fontWeight: 700,
}));

const StyledSubTitle = styled('h2')(({ theme }) => ({
  fontWeight: 400,
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(5),
}));

interface SearchSuggestion {
  id: string;
  title: string;
  description?: string;
  type?: 'recent' | 'suggestion' | 'trending';
}

interface BannerProps {
  title: {
    text: string;
    fontSize: string;
    color: string;
  };
  subtitle: {
    text: string;
    fontSize: string;
    color: string;
  };
  bg_url?: string;
  search: {
    placeholder: string;
    hot: string[];
  };
  btns: {
    type: ButtonProps['variant'];
    text: string;
    href: string;
  }[];
  onSearch?: (value: string, type?: 'search' | 'chat') => void;
  onSearchSuggestions?: (query: string) => Promise<SearchSuggestion[]>;
  baseUrl?: string;
}

const Banner = React.memo(
  ({
    title,
    subtitle,
    bg_url,
    search,
    btns,
    onSearch,
    onSearchSuggestions,
    baseUrl = '',
  }: BannerProps) => {
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [anchorElWidth, setAnchorElWidth] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
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
      setSearchText(value);
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
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // e.preventDefault();
        // if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        //   const selectedSuggestion = suggestions[selectedIndex];
        //   setSearchText(selectedSuggestion.title);
        //   onSearch?.(selectedSuggestion.title);
        // } else {
        //   onSearch?.(searchText);
        // }
        onSearch?.(searchText, 'chat');
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
      setSearchText(suggestion.title);
      onSearch?.(suggestion.title);
      setAnchorEl(null);
      setSelectedIndex(-1);
    };

    // 处理输入框聚焦
    const handleInputFocus = (e: React.FocusEvent) => {
      if (searchText.trim()) {
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

    // 清理定时器
    useEffect(() => {
      return () => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }
      };
    }, []);

    return (
      <StyledBanner
        sx={{
          backgroundImage: `url(${bg_url})`,
        }}
      >
        <StyledTopicBox sx={{ alignItems: 'flex-start', gap: 0, py: '140px' }}>
          <StyledTitle
            sx={{
              fontSize: `${title.fontSize || 60}px`,
              color: title.color || '#5F58FE',
            }}
          >
            {title.text}
          </StyledTitle>
          {subtitle.text && (
            <StyledSubTitle
              sx={{
                fontSize: `${subtitle.fontSize || 16}px`,
                color: subtitle.color || 'rgba(255,255,255,0.5)',
              }}
            >
              {subtitle.text}
            </StyledSubTitle>
          )}

          <Box sx={{ position: 'relative', width: '100%' }}>
            <TextField
              ref={inputRef}
              fullWidth
              placeholder={search.placeholder}
              value={searchText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              slotProps={{
                input: {
                  sx: {
                    bgcolor: '#fff',
                    color: '#000',
                    height: 64,
                    '.MuiOutlinedInput-notchedOutline': {
                      border: '0px !important',
                    },
                  },
                  endAdornment: (
                    <InputAdornment position='end'>
                      {isLoading ? (
                        <CircularProgress size={20} />
                      ) : (
                        <IconFasong
                          sx={{
                            color: 'primary.main',
                            cursor: 'pointer',
                            fontSize: 22,
                          }}
                          onClick={() => onSearch?.(searchText, 'chat')}
                        />
                      )}
                    </InputAdornment>
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
                                fontWeight: index === selectedIndex ? 600 : 400,
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
                    onClick={() => onSearch?.(searchText, 'chat')}
                  >
                    <IconXingxing sx={{ mr: 0.5 }} />
                    智能问答
                  </Button>
                  <Button
                    variant='outlined'
                    color='primary'
                    onClick={() => onSearch?.(searchText, 'search')}
                  >
                    全站搜索
                  </Button>
                </Stack>
              </Paper>
            </Popper>
          </Box>
          {search.hot?.length > 0 && (
            <Stack direction='row' gap={3} sx={{ fontSize: 12, mt: 3 }}>
              <Box sx={{ color: 'rgba(255,255,255, 0.5)' }}>热门搜索</Box>
              {search.hot?.map(hot => (
                <Box
                  key={hot}
                  sx={{
                    color: 'rgba(255,255,255, 0.7)',
                    cursor: 'pointer',
                    '&:hover': {
                      color: 'rgba(255,255,255, 1)',
                    },
                  }}
                  onClick={() => onSearch?.(hot)}
                >
                  {hot}
                </Box>
              ))}
            </Stack>
          )}
          {btns.length > 0 && (
            <Stack direction='row' gap={5} sx={{ mt: 5 }}>
              {btns.map(btn => (
                <Button
                  key={btn.text}
                  variant={btn.type}
                  href={btn.href}
                  target='_blank'
                  size='large'
                  color='primary'
                  sx={{
                    fontSize: 18,
                    px: '69px',
                    py: '12px',
                  }}
                >
                  {btn.text}
                </Button>
              ))}
            </Stack>
          )}
        </StyledTopicBox>
      </StyledBanner>
    );
  },
);

export default Banner;
