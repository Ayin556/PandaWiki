'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IconXingxing } from '@panda-wiki/icons';
import { useTextAnimation } from '../hooks/useGsapAnimation';
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
  margin: theme.spacing(2, 2, 0),
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '20px',
  backgroundColor: '#21212d',
}));

const StyledTitle = styled('h1')(({ theme }) => ({
  fontSize: 36,
  fontWeight: 700,
  wordBreak: 'break-all',
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
  onQaClick?: () => void;
}

const Banner = React.memo(
  ({
    title,
    subtitle,
    bg_url,
    search,
    btns = [],
    onSearch,
    onSearchSuggestions,
    baseUrl = '',
    onQaClick,
  }: BannerProps) => {
    const [searchText, setSearchText] = useState('');
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [anchorElWidth, setAnchorElWidth] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // 添加文字动画效果
    const titleRef = useTextAnimation(0, 0.1);
    const subtitleRef = useTextAnimation(0.2, 0.1);

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
        setSearchText('');
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
      setSearchText('');
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
            ref={titleRef}
            sx={{
              fontSize: `${title.fontSize || 60}px`,
              color: title.color || '#5F58FE',
            }}
          >
            {title.text}
          </StyledTitle>
          {subtitle.text && (
            <StyledSubTitle
              ref={subtitleRef}
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
              value={''}
              focused={false}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              onClick={() => onQaClick?.()}
              slotProps={{
                input: {
                  readOnly: true,
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
                          onClick={() => {
                            onSearch?.(searchText, 'chat');
                            setSearchText('');
                          }}
                        />
                      )}
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
          {search.hot?.length > 0 && (
            <Stack direction='row' gap={3} sx={{ fontSize: 16, mt: 3 }}>
              <Box sx={{ color: 'rgba(255,255,255, 0.5)', flexShrink: 0 }}>
                热门搜索
              </Box>
              <Stack direction='row' gap='4px 24px' flexWrap='wrap'>
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
            </Stack>
          )}
          {btns.length > 0 && (
            <Stack
              direction='row'
              gap={{
                xs: '16px 24px',
                md: '16px 40px',
              }}
              sx={{ mt: 5 }}
              flexWrap='wrap'
            >
              {btns.map(btn => (
                <Button
                  key={btn.text}
                  variant={btn.type}
                  href={btn.href}
                  target='_blank'
                  size='large'
                  color='primary'
                  sx={{
                    ...(btn.type === 'outlined' && {
                      borderWidth: 2,
                    }),
                    fontSize: {
                      xs: 14,
                      md: 18,
                    },
                    px: {
                      xs: 3,
                      md: '69px',
                    },
                    py: {
                      xs: 1,
                      md: '12px',
                    },
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
