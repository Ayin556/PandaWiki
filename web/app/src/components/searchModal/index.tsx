'use client';

import { ConversationItem } from '@/assets/type';
import { IconSousuo } from '@panda-wiki/icons';
import { useStore } from '@/provider';
import { message, Modal } from '@ctzhian/ui';
import { postShareV1ChatSearch } from '@/request/ShareChatSearch';
import { DomainNodeContentChunkSSE } from '@/request/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import SearchResult from '../../views/chat/SearchResult';
import { Box, Stack, TextField } from '@mui/material';

const SearchModal = ({
  conversation: initialConversation = [],
}: {
  conversation?: ConversationItem[];
}) => {
  const { mobile = false, searchModalOpen, setSearchModalOpen } = useStore();
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [chunkResult, setChunkResult] = useState<DomainNodeContentChunkSSE[]>(
    [],
  );

  const onSearch = useCallback(async (q: string) => {
    setLoading(true);
    setChunkResult([]);
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
      setLoading(false);
      return;
    }
    postShareV1ChatSearch({ message: q, captcha_token: token })
      .then(res => {
        setChunkResult(res.node_result || []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // @ts-ignore
    window.CAP_CUSTOM_WASM_URL =
      window.location.origin + '/cap@0.0.6/cap_wasm.min.js';
  }, []);

  useEffect(() => {
    if (searchModalOpen) {
      const searchQuery = sessionStorage.getItem('chat_search_query');
      if (searchQuery) {
        setSearchValue(searchQuery);
        sessionStorage.removeItem('chat_search_query');
        onSearch(searchQuery);
      }
    } else {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete('sid');
      window.history.replaceState(null, '', currentUrl.toString());
    }
  }, [searchModalOpen]);

  const handleSearchAbort = () => {
    setLoading(false);
  };

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
      {(loading || chunkResult.length > 0) && (
        <SearchResult list={chunkResult} loading={loading} />
      )}
    </Modal>
  );
};

export default SearchModal;
