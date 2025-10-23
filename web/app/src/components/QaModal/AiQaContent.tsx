import { useStore } from '@/provider';
import SSEClient from '@/utils/fetch';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { ChunkResultItem, ConversationItem } from '@/assets/type';
import { AnswerStatus } from '@/views/chat/constant';
import aiLoading from '@/assets/images/ai-loading.gif';
import { getShareV1ConversationDetail } from '@/request/ShareConversation';
import { message } from '@ctzhian/ui';
import Feedback from '@/components/feedback';

import {
  IconArrowUp,
  IconCai,
  IconCaied,
  IconCopy,
  IconZan,
  IconZaned,
} from '@/components/icons';
import MarkDown from '@/components/markdown';
import MarkDown2 from '@/components/markdown2';
import { postShareV1ChatFeedback } from '@/request/ShareChat';
import { copyText } from '@/utils';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Typography,
  Tooltip,
} from '@mui/material';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import ChatLoading from '../../views/chat/ChatLoading';
import { IconTupian, IconFasong } from '@panda-wiki/icons';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const LoadingContent = () => {
  return (
    <Stack direction='row' alignItems='center' gap={1}>
      <Image src={aiLoading} alt='ai-loading' width={20} height={20} />
      <Typography variant='body2' sx={{ fontSize: 14, color: 'text.tertiary' }}>
        正在搜索结果...
      </Typography>
    </Stack>
  );
};

const AiQaContent: React.FC<{
  hotSearch: string[];
  placeholder: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}> = ({ hotSearch, placeholder, inputRef }) => {
  const sseClientRef = useRef<SSEClient<{
    type: string;
    content: string;
    chunk_result: ChunkResultItem;
  }> | null>(null);

  const messageIdRef = useRef('');
  const [chunkResult, setChunkResult] = useState<ChunkResultItem[]>([]);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState<keyof typeof AnswerStatus>(4);
  const [nonce, setNonce] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [answer, setAnswer] = useState('');
  const [isScrolling, setIsScrolling] = useState(true);
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const [conversationItem, setConversationItem] =
    useState<ConversationItem | null>(null);
  const [uploadedImages, setUploadedImages] = useState<
    Array<{
      id: string;
      url: string;
      file: File;
    }>
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fuzzySuggestions, setFuzzySuggestions] = useState<string[]>([]);
  const [showFuzzySuggestions, setShowFuzzySuggestions] = useState(false);

  const searchParams = useSearchParams();

  const onReset = () => {
    setConversationId('');
    setConversation([]);
    setChunkResult([]);
    setAnswer('');
    setInput('');
    // 清理图片URL
    uploadedImages.forEach(img => {
      if (img.url.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
    });
    setUploadedImages([]);
    setLoading(false);
    setNonce('');
  };

  const handleSearch = () => {
    if (input.length > 0) {
      onSearch(input);
      setInput('');
      // 清理图片URL
      uploadedImages.forEach(img => {
        if (img.url.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
      setUploadedImages([]);
    }
  };

  const onSuggestionClick = (text: string) => {
    setInput('');
    onSearch(text);
  };

  // 处理图片选择（支持多张）
  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const maxImages = 9; // 最多9张图片
    const remainingSlots = maxImages - uploadedImages.length;
    if (remainingSlots <= 0) {
      message.warning(`最多只能上传 ${maxImages} 张图片`);
      return;
    }

    const filesToAdd = Array.from(files).slice(0, remainingSlots);

    try {
      const newImages: Array<{
        id: string;
        url: string;
        file: File;
      }> = [];

      for (const file of filesToAdd) {
        // 验证文件类型
        if (!file.type.startsWith('image/')) {
          message.error('只支持上传图片文件');
          continue;
        }

        // 验证文件大小 (10MB)
        if (file.size > 10 * 1024 * 1024) {
          message.error('图片大小不能超过 10MB');
          continue;
        }

        // 创建本地预览 URL
        const localUrl = URL.createObjectURL(file);

        newImages.push({
          id: Date.now().toString() + Math.random(),
          url: localUrl,
          file,
        });
      }

      const updatedImages = [...uploadedImages, ...newImages];
      setUploadedImages(updatedImages);
    } catch (error: any) {
      message.error(error.message || '图片选择失败');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageSelect(event.target.files);
    // 重置 input value 以允许上传相同文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    const imageToRemove = uploadedImages.find(img => img.id === id);
    if (imageToRemove && imageToRemove.url.startsWith('blob:')) {
      // 释放本地 URL
      URL.revokeObjectURL(imageToRemove.url);
    }

    const updatedImages = uploadedImages.filter(img => img.id !== id);
    setUploadedImages(updatedImages);
  };

  // 处理粘贴上传
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault();
      const dataTransfer = new DataTransfer();
      imageFiles.forEach(file => dataTransfer.items.add(file));
      await handleImageSelect(dataTransfer.files);
    }
  };

  // 处理输入变化，显示模糊搜索建议
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);

    // if (value.trim().length > 0) {
    //   // 改进的模糊搜索逻辑
    //   const filtered = mockFuzzySuggestions
    //     .filter(suggestion => {
    //       const lowerSuggestion = suggestion.toLowerCase();
    //       const lowerValue = value.toLowerCase();
    //       // 支持前缀匹配和包含匹配
    //       return (
    //         lowerSuggestion.startsWith(lowerValue) ||
    //         lowerSuggestion.includes(lowerValue)
    //       );
    //     })
    //     .slice(0, 5); // 限制显示数量

    //   setFuzzySuggestions(filtered);
    //   setShowFuzzySuggestions(true);
    // } else {
    //   setShowFuzzySuggestions(false);
    //   setFuzzySuggestions([]);
    // }
  };

  // 选择模糊搜索建议
  const handleFuzzySuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowFuzzySuggestions(false);
    setFuzzySuggestions([]);
  };

  // 高亮显示匹配的文本
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;

    // 转义特殊字符，避免正则表达式错误
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      // 检查是否匹配（不区分大小写）
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <Box
            component='span'
            key={index}
            sx={{
              color: 'primary.main',
            }}
          >
            {part}
          </Box>
        );
      }
      return part;
    });
  };

  // 处理输入框失去焦点
  const handleInputBlur = () => {
    // 延迟隐藏，让用户有时间点击建议
    setTimeout(() => {
      setShowFuzzySuggestions(false);
    }, 200);
  };

  // 处理输入框获得焦点
  const handleInputFocus = () => {
    if (input.trim().length > 0) {
      setShowFuzzySuggestions(true);
    }
  };

  const chatAnswer = useCallback(
    async (q: string) => {
      setLoading(true);
      setThinking(1);

      let token = '';

      const Cap = (await import('@cap.js/widget')).default;
      const cap = new Cap({
        apiEndpoint: '/share/v1/captcha/',
      });
      try {
        const solution = await cap.solve();
        token = solution.token;
      } catch (error) {
        message.error('验证失败');
        console.log(error, 'error---------');
        return;
      }

      const reqData = {
        message: q,
        nonce: '',
        conversation_id: '',
        app_type: 1,
        captcha_token: token,
      };
      if (conversationId) reqData.conversation_id = conversationId;
      if (nonce) reqData.nonce = nonce;

      if (sseClientRef.current) {
        sseClientRef.current.subscribe(
          JSON.stringify(reqData),
          ({ type, content, chunk_result }) => {
            if (type === 'conversation_id') {
              setConversationId(prev => prev + content);
            } else if (type === 'message_id') {
              messageIdRef.current += content;
            } else if (type === 'nonce') {
              setNonce(prev => prev + content);
            } else if (type === 'error') {
              setLoading(false);
              setThinking(4);
              setAnswer(prev => {
                if (content) {
                  return prev + `\n\n回答出现错误：<error>${content}</error>`;
                }
                return prev + '\n\n回答出现错误，请重试';
              });
              if (content) message.error(content);
            } else if (type === 'done') {
              setAnswer(prevAnswer => {
                setChunkResult(prevChunkResult => {
                  setConversation(prev => {
                    const newConversation = [...prev];
                    const lastConversation =
                      newConversation[newConversation.length - 1];
                    if (lastConversation) {
                      lastConversation.a = prevAnswer;
                      lastConversation.update_time = dayjs().format(
                        'YYYY-MM-DD HH:mm:ss',
                      );
                      lastConversation.message_id = messageIdRef.current;
                      lastConversation.source = 'chat';
                      lastConversation.chunk_result = prevChunkResult;
                    }

                    return newConversation;
                  });
                  return prevChunkResult;
                });

                return '';
              });

              setLoading(false);
              setThinking(4);
            } else if (type === 'data') {
              setAnswer(prev => {
                const newAnswer = prev + content;
                if (newAnswer.includes('</think>')) {
                  setThinking(3);
                  return newAnswer;
                }
                if (newAnswer.includes('<think>')) {
                  setThinking(2);
                  return newAnswer;
                }
                setThinking(3);
                return newAnswer;
              });
            } else if (type === 'chunk_result') {
              setChunkResult(prev => [...prev, chunk_result]);
              setTimeout(() => {
                scrollToBottom();
              }, 200);
            }
          },
        );
      }
    },
    [conversationId, nonce, sseClientRef, chunkResult],
  );

  useEffect(() => {
    // @ts-ignore
    window.CAP_CUSTOM_WASM_URL =
      window.location.origin + '/cap@0.0.6/cap_wasm.min.js';
  }, []);

  const onSearch = (q: string, reset: boolean = false) => {
    if (loading || !q.trim()) return;
    setIsScrolling(true);
    const newConversation = reset
      ? []
      : conversation.some(item => item.source === 'history')
        ? []
        : [...conversation];
    newConversation.push({
      q,
      a: '',
      score: 0,
      message_id: '',
      update_time: '',
      source: 'chat',
      chunk_result: [],
    });
    messageIdRef.current = '';
    setConversation(newConversation);
    setTimeout(() => {
      setChunkResult([]);
    }, 0);
    setAnswer('');
    setTimeout(() => chatAnswer(q), 0);
    setTimeout(scrollToBottom, 200);
  };

  const handleSearchAbort = () => {
    sseClientRef.current?.unsubscribe();
    setLoading(false);
    setThinking(4);
  };

  const { mobile = false, themeMode = 'light', kbDetail } = useStore();

  const isFeedbackEnabled =
    // @ts-ignore
    kbDetail?.settings?.ai_feedback_settings?.is_enabled ?? true;

  const scrollToBottom = () => {
    const container = document.querySelector('.conversation-container');
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleScore = async (
    message_id: string,
    score: number,
    type?: string,
    content?: string,
  ) => {
    const data: any = {
      conversation_id: conversationId,
      message_id,
      score,
    };
    if (type) data.type = type;
    if (content) data.feedback_content = content;
    await postShareV1ChatFeedback(data);
    message.success('反馈成功');
    setConversation(
      conversation.map(item => {
        return item.message_id === message_id ? { ...item, score } : item;
      }),
    );
  };

  useEffect(() => {
    sseClientRef.current = new SSEClient({
      url: `/share/v1/chat/message`,
      headers: {
        'Content-Type': 'application/json',
      },
      onCancel: () => {
        setLoading(false);
        setThinking(4);
        setAnswer(prev => {
          let value = '';
          if (prev) {
            value = prev + '\n\n<error>Request canceled</error>';
          }
          setConversation(prev => {
            const newConversation = [...prev];
            if (newConversation[newConversation.length - 1]) {
              newConversation[newConversation.length - 1].a = value;
              newConversation[newConversation.length - 1].update_time =
                dayjs().format('YYYY-MM-DD HH:mm:ss');
              newConversation[newConversation.length - 1].message_id =
                messageIdRef.current;
            }
            return newConversation;
          });
          return '';
        });
      },
    });
    const searchQuery =
      sessionStorage.getItem('chat_search_query') || searchParams.get('ask');
    if (searchQuery) {
      sessionStorage.removeItem('chat_search_query');
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete('cid');
      window.history.replaceState(null, '', newSearchParams.toString());
      onSearch(searchQuery, true);
    }
    return () => {
      handleSearchAbort();
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('cid');
      window.history.replaceState(null, '', currentUrl.toString());
      setTimeout(() => {
        onReset();
      });
    };
  }, []);

  useEffect(() => {
    if (conversationId) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('sid');
      currentUrl.searchParams.set('cid', conversationId);
      window.history.replaceState(null, '', currentUrl.toString());
    }
  }, [conversationId]);

  useEffect(() => {
    const cid = searchParams.get('cid');
    if (cid) {
      const conversation: ConversationItem[] = [];
      getShareV1ConversationDetail({
        id: cid,
      }).then(res => {
        if (res.messages) {
          let current: Partial<ConversationItem> = {};
          res.messages.forEach(message => {
            if (message.role === 'user') {
              if (current.q) {
                conversation.push({
                  q: current.q,
                  a: '',
                  score: 0,
                  update_time: '',
                  message_id: '',
                  source: 'history',
                  chunk_result: [],
                } as ConversationItem);
              }
              current = {
                q: message.content,
              };
            } else if (message.role === 'assistant') {
              if (current.q) {
                current.a = message.content;
                current.update_time = message.created_at;
                current.score = 0;
                current.message_id = '';
                current.source = 'history';
                conversation.push(current as ConversationItem);
                current = {};
              }
            }
          });

          if (current.q) {
            conversation.push({
              q: current.q,
              a: '',
              score: 0,
              update_time: '',
              message_id: '',
              source: 'history',
              chunk_result: [],
            });
          }
        }
        setConversation(conversation);
        setIsScrolling(false);
      });
    }
  }, []);

  useEffect(() => {
    if (!loading && isScrolling) {
      setTimeout(() => {
        scrollToBottom();
      });
    }
  }, [loading, isScrolling]);

  return (
    <Box sx={{ flex: 1 }}>
      <Stack
        direction='column'
        gap={2}
        className='conversation-container'
        sx={{
          maxHeight: 'calc(100vh - 334px)',
          overflow: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          mb: conversation?.length > 0 ? 2 : 0,
        }}
      >
        {conversation.map((item, index) => (
          <Box key={index}>
            <Accordion
              key={index}
              defaultExpanded={true}
              sx={{
                bgcolor:
                  themeMode === 'dark'
                    ? 'background.default'
                    : 'background.paper3',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 24 }} />}
                sx={{
                  userSelect: 'text',
                }}
              >
                <Box
                  sx={{
                    fontWeight: '700',
                    lineHeight: '24px',
                    wordBreak: 'break-all',
                  }}
                >
                  {item.q}
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 2 }}>
                <Accordion
                  sx={{
                    bgcolor: 'transparent',
                    border: 'none',
                    p: 0,
                    pb: 2,
                  }}
                  defaultExpanded
                >
                  {(index === conversation.length - 1
                    ? chunkResult.length > 0
                    : item.chunk_result.length > 0) && (
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        justifyContent: 'flex-start',
                        gap: 2,
                        '.MuiAccordionSummary-content': {
                          flexGrow: 0,
                        },
                      }}
                    >
                      <Typography
                        variant='body2'
                        sx={{ fontSize: 12, color: 'text.tertiary' }}
                      >
                        共找到{' '}
                        {index === conversation.length - 1
                          ? chunkResult.length
                          : item.chunk_result.length}{' '}
                        个结果
                      </Typography>
                    </AccordionSummary>
                  )}

                  <AccordionDetails
                    sx={{
                      pt: 0,
                      pl: 2,
                      borderTop: 'none',
                      borderLeft: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack gap={1}>
                      {(index === conversation.length - 1
                        ? chunkResult
                        : item.chunk_result
                      ).map((chunk, index) => (
                        <Box
                          key={index}
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              '.hover-primary': {
                                color: 'primary.main',
                              },
                            },
                          }}
                        >
                          <Typography
                            variant='body2'
                            className='hover-primary'
                            sx={{ fontSize: 12, color: 'text.tertiary' }}
                            onClick={() => {
                              window.open(`/node/${chunk.node_id}`, '_blank');
                            }}
                          >
                            {chunk.name}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
                {item.source === 'history' ? (
                  <MarkDown content={item.a} />
                ) : index === conversation.length - 1 ? (
                  // 最后一个对话项：显示合并后的内容，避免闪烁
                  <MarkDown2 content={item.a || answer || ''} />
                ) : (
                  // 非最后一个对话项：正常显示
                  <MarkDown2 content={item.a} />
                )}

                {index === conversation.length - 1 &&
                  loading &&
                  !answer &&
                  !item.a &&
                  chunkResult.length === 0 && (
                    <>
                      <LoadingContent />
                    </>
                  )}
              </AccordionDetails>
            </Accordion>
            {(index !== conversation.length - 1 || !loading) && (
              <Stack
                direction={mobile ? 'column' : 'row'}
                alignItems={mobile ? 'flex-start' : 'center'}
                justifyContent='space-between'
                gap={mobile ? 1 : 3}
                sx={{
                  fontSize: 12,
                  color: 'text.tertiary',
                  mt: 2,
                }}
              >
                {/* <Box>{kbDetail?.settings?.disclaimer_settings?.content}</Box> */}

                <Stack direction='row' gap={3} alignItems='center'>
                  <span>生成于 {dayjs(item.update_time).fromNow()}</span>

                  <IconCopy
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      copyText(item.a);
                    }}
                  />

                  {isFeedbackEnabled && item.source === 'chat' && (
                    <>
                      {item.score === 1 && (
                        <IconZaned sx={{ cursor: 'pointer' }} />
                      )}
                      {item.score !== 1 && (
                        <IconZan
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (item.score === 0)
                              handleScore(item.message_id, 1);
                          }}
                        />
                      )}
                      {item.score !== -1 && (
                        <IconCai
                          sx={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (item.score === 0) {
                              setConversationItem(item);
                              setOpen(true);
                            }
                          }}
                        />
                      )}
                      {item.score === -1 && (
                        <IconCaied sx={{ cursor: 'pointer' }} />
                      )}
                    </>
                  )}
                </Stack>
              </Stack>
            )}
          </Box>
        ))}
      </Stack>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Stack
          sx={{
            px: 1.5,
            py: 1,
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'background.paper3',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 2,
            bgcolor: 'background.paper3',
            transition: 'border-color 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
            },
            '&:focus-within': {
              borderColor: 'dark.main',
            },
          }}
        >
          {/* 多张图片预览 */}
          {uploadedImages.length > 0 && (
            <Stack
              direction='row'
              flexWrap='wrap'
              gap={1}
              sx={{
                width: '100%',
                zIndex: 1,
              }}
            >
              {uploadedImages.map(image => (
                <Box
                  key={image.id}
                  sx={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Image
                    src={image.url}
                    alt='uploaded'
                    width={40}
                    height={40}
                    style={{
                      objectFit: 'cover',
                    }}
                  />
                  <IconButton
                    size='small'
                    onClick={() => handleRemoveImage(image.id)}
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 16,
                      height: 16,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',

                      transition: 'opacity 0.2s',
                      '&:hover': {
                        bgcolor: 'background.paper',
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 10 }} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}

          <TextField
            fullWidth
            multiline
            rows={2}
            disabled={loading}
            ref={inputRef}
            sx={{
              bgcolor: 'background.paper3',
              '.MuiInputBase-root': {
                p: 0,
                overflow: 'hidden',
                height: '52px !important',
              },
              textarea: {
                borderRadius: 0,
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                p: '2px',
              },

              fieldset: {
                border: 'none',
              },
            }}
            size='small'
            value={input}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onPaste={handlePaste}
            onKeyDown={e => {
              const isComposing =
                e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229;
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                input.length > 0 &&
                !isComposing
              ) {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder={placeholder}
            autoComplete='off'
          />
          <Stack
            direction='row'
            alignItems='center'
            justifyContent='space-between'
            sx={{ width: '100%' }}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              multiple
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <Tooltip title='敬请期待'>
              <IconButton
                size='small'
                // onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                sx={{
                  flexShrink: 0,
                }}
              >
                <IconTupian sx={{ fontSize: 20, color: 'text.secondary' }} />
              </IconButton>
            </Tooltip>

            <Box
              sx={{
                fontSize: 12,
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              {loading ? (
                <ChatLoading
                  thinking={thinking}
                  onClick={() => {
                    setThinking(4);
                    handleSearchAbort();
                  }}
                />
              ) : (
                <IconButton
                  size='small'
                  onClick={() => {
                    if (input.length > 0) {
                      handleSearchAbort();
                      setThinking(1);
                      handleSearch();
                    }
                  }}
                >
                  <IconFasong
                    sx={{
                      fontSize: 16,
                      color:
                        input.length > 0 ? 'primary.main' : 'text.disabled',
                    }}
                  />
                </IconButton>
              )}
            </Box>
          </Stack>
        </Stack>
      </Box>
      <Feedback
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleScore}
        data={conversationItem}
      />
      {/* 模糊搜索建议列表 */}
      {showFuzzySuggestions &&
        fuzzySuggestions.length > 0 &&
        conversation.length === 0 && (
          <Stack
            sx={{
              mt: 1,
              position: 'relative',
              zIndex: 1000,
            }}
            gap={0.5}
          >
            {fuzzySuggestions.map((suggestion, index) => (
              <Box
                key={index}
                onClick={() => handleFuzzySuggestionClick(suggestion)}
                sx={{
                  py: 1,
                  px: 2,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: 'transparent',
                  color: 'text.primary',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                  display: 'flex',
                  alignItems: 'center',
                  width: 'auto',
                  fontSize: 14,
                  fontWeight: 400,
                }}
              >
                {highlightMatch(suggestion, input)}
              </Box>
            ))}
          </Stack>
        )}

      {/* 原始搜索建议列表 - 只在没有模糊搜索建议时显示 */}
      {!showFuzzySuggestions &&
        hotSearch.length > 0 &&
        conversation.length === 0 && (
          <Stack sx={{ mt: 2 }} gap={1}>
            {hotSearch.map((suggestion, index) => (
              <Box
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                sx={{
                  py: '6px',
                  px: 2,
                  mb: 1,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: '#F8F9FA',
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                  },
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 'auto',
                }}
              >
                <Typography
                  variant='body2'
                  sx={{
                    fontSize: 14,
                    flex: 1,
                  }}
                >
                  {suggestion} →
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
    </Box>
  );
};

export default AiQaContent;
