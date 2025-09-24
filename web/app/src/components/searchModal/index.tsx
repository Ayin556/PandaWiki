'use client';

import { ChunkResultItem, ConversationItem } from '@/assets/type';
import { IconSousuo } from '@panda-wiki/icons';
import { useStore } from '@/provider';
import SSEClient from '@/utils/fetch';
import { message, Modal } from '@ctzhian/ui';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';

import SearchResult from '../../views/chat/SearchResult';
import { AnswerStatus } from '../../views/chat/constant';
import { Box, Stack, TextField } from '@mui/material';

const SearchModal = ({
  conversation: initialConversation = [],
}: {
  conversation?: ConversationItem[];
}) => {
  const { mobile = false, searchModalOpen, setSearchModalOpen } = useStore();
  const [searchValue, setSearchValue] = useState('');

  const sseClientRef = useRef<SSEClient<{
    type: string;
    content: string;
    chunk_result: ChunkResultItem[];
  }> | null>(null);

  const messageIdRef = useRef('');
  const [conversation, setConversation] =
    useState<ConversationItem[]>(initialConversation);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState<keyof typeof AnswerStatus>(4);
  const [nonce, setNonce] = useState('');
  const [chunkResult, setChunkResult] = useState<any[]>([]);
  const [chunkLoading, setChunkLoading] = useState(false);
  const [conversationId, setConversationId] = useState('');
  const [answer, setAnswer] = useState('');
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  const chatAnswer = useCallback(
    async (q: string) => {
      setChunkLoading(true);
      setLoading(true);
      setThinking(1);
      setIsUserScrolling(false);

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
              setChunkLoading(false);
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
                  }

                  return newConversation;
                });
                return '';
              });
              setChunkLoading(false);
              setLoading(false);
              setThinking(4);
            } else if (type === 'data') {
              setChunkLoading(false);
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
              setChunkResult(prev => {
                return [...prev, chunk_result];
              });
            }
          },
        );
      }
    },
    [conversationId, nonce],
  );

  useEffect(() => {
    // @ts-ignore
    window.CAP_CUSTOM_WASM_URL =
      window.location.origin + '/cap@0.0.6/cap_wasm.min.js';
  }, []);

  const onSearch = useCallback(
    (q: string, reset: boolean = false) => {
      if (loading || !q.trim()) return;
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
      });
      messageIdRef.current = '';
      setConversation(newConversation);
      setAnswer('');
      setChunkResult([]);
      setTimeout(() => chatAnswer(q), 0);
    },
    [loading, conversation, chatAnswer],
  );

  useEffect(() => {
    if (searchModalOpen) {
      const searchQuery = sessionStorage.getItem('chat_search_query');
      if (searchQuery) {
        setSearchValue(searchQuery);
        sessionStorage.removeItem('chat_search_query');
        onSearch(searchQuery, true);
      }
    } else {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('sid');
      window.history.replaceState(null, '', currentUrl.toString());
    }
  }, [searchModalOpen]);

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
            newConversation[newConversation.length - 1].a = value;
            newConversation[newConversation.length - 1].update_time =
              dayjs().format('YYYY-MM-DD HH:mm:ss');
            newConversation[newConversation.length - 1].message_id =
              messageIdRef.current;
            return newConversation;
          });
          return '';
        });
      },
    });
  }, []);

  const handleSearchAbort = () => {
    sseClientRef.current?.unsubscribe();
    setChunkLoading(false);
    setLoading(false);
    setThinking(4);
  };

  useEffect(() => {
    if (conversationId) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('cid');
      currentUrl.searchParams.set('sid', conversationId);
      window.history.replaceState(null, '', currentUrl.toString());
    }
  }, [conversationId]);

  return (
    <Modal
      open={searchModalOpen}
      onCancel={() => setSearchModalOpen?.(false)}
      title={
        <Stack direction='row' alignItems='center' gap={2} sx={{ pr: '80px' }}>
          <Box sx={{ flexShrink: 0 }}>全站搜索</Box>
          <TextField
            fullWidth
            placeholder='请输入搜索内容'
            size='small'
            slotProps={{
              input: {
                sx: {
                  fontSize: 14,
                },
                endAdornment: (
                  <IconSousuo
                    onClick={() => {
                      handleSearchAbort();
                      setThinking(1);
                      onSearch(searchValue);
                    }}
                    sx={{
                      cursor: 'pointer',
                      color: 'text.tertiary',
                      fontSize: 16,
                    }}
                  />
                ),
              },
            }}
            value={searchValue}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleSearchAbort();
                setThinking(1);
                onSearch(searchValue);
              }
            }}
            onChange={e => setSearchValue(e.target.value)}
          />
        </Stack>
      }
      footer={null}
      width={1000}
    >
      {(chunkLoading || chunkResult.length > 0) && (
        <SearchResult list={chunkResult} loading={chunkLoading} />
      )}
    </Modal>
  );
};

export default SearchModal;
