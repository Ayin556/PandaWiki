'use client';

import { ChunkResultItem, ConversationItem } from '@/assets/type';
import { useStore } from '@/provider';
import SSEClient from '@/utils/fetch';
import { message, Modal } from '@ctzhian/ui';
import { useSearchParams } from 'next/navigation';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import ChatResult from '../../views/chat/ChatResult';
import { AnswerStatus } from '../../views/chat/constant';
import { getShareV1ConversationDetail } from '@/request/ShareConversation';

const AiQaModal = () => {
  const { qaModalOpen, setQaModalOpen } = useStore();
  const sseClientRef = useRef<SSEClient<{
    type: string;
    content: string;
    chunk_result: ChunkResultItem[];
  }> | null>(null);

  const messageIdRef = useRef('');
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState<keyof typeof AnswerStatus>(4);
  const [nonce, setNonce] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [answer, setAnswer] = useState('');
  const [isScrolling, setIsScrolling] = useState(true);

  const searchParams = useSearchParams();

  const onReset = () => {
    setConversationId('');
    setConversation([]);
    setAnswer('');

    setLoading(false);
    setNonce('');
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
            }
          },
        );
      }
    },
    [conversationId, nonce, sseClientRef],
  );

  useEffect(() => {
    // @ts-ignore
    window.CAP_CUSTOM_WASM_URL =
      window.location.origin + '/cap@0.0.6/cap_wasm.min.js';
  }, []);

  const onSearch = useCallback(
    (q: string, reset: boolean = false) => {
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
      });
      messageIdRef.current = '';
      setConversation(newConversation);
      setAnswer('');
      setTimeout(() => chatAnswer(q), 0);
    },
    [loading, conversation, chatAnswer],
  );

  const handleSearchAbort = () => {
    sseClientRef.current?.unsubscribe();
    setLoading(false);
    setThinking(4);
  };

  useEffect(() => {
    if (qaModalOpen) {
      const searchQuery = sessionStorage.getItem('chat_search_query');
      if (searchQuery) {
        sessionStorage.removeItem('chat_search_query');
        onSearch(searchQuery, true);
      }
    } else {
      onReset();
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('cid');
      window.history.replaceState(null, '', currentUrl.toString());
    }
  }, [qaModalOpen]);

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
            });
          }
        }
        setConversation(conversation);
        setQaModalOpen?.(true);
        setIsScrolling(false);
      });
    }
  }, []);

  return (
    <Modal
      width={1000}
      open={qaModalOpen}
      onCancel={() => setQaModalOpen?.(false)}
      title='智能问答'
      footer={null}
    >
      <ChatResult
        conversation={conversation}
        conversation_id={conversationId}
        answer={answer}
        loading={loading}
        thinking={thinking}
        setThinking={setThinking}
        onSearch={onSearch}
        setConversation={setConversation}
        onReset={onReset}
        handleSearchAbort={handleSearchAbort}
        isScrolling={isScrolling}
      />
    </Modal>
  );
};

export default AiQaModal;
