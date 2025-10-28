import React from 'react';
import { Box, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import { IconTupian, IconFasong } from '@panda-wiki/icons';
import CloseIcon from '@mui/icons-material/Close';
import Image from 'next/image';
import ChatLoading from '@/views/chat/ChatLoading';
import { UploadedImage } from '../types';
import { AnswerStatusType } from '../constants';

interface InputAreaProps {
  input: string;
  loading: boolean;
  thinking: AnswerStatusType;
  placeholder: string;
  uploadedImages: UploadedImage[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputFocus: () => void;
  onInputBlur: () => void;
  onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onSearch: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  onSearchAbort: () => void;
  setThinking: (value: AnswerStatusType) => void;
}

export const InputArea: React.FC<InputAreaProps> = ({
  input,
  loading,
  thinking,
  placeholder,
  uploadedImages,
  fileInputRef,
  inputRef,
  onInputChange,
  onInputFocus,
  onInputBlur,
  onPaste,
  onSearch,
  onImageUpload,
  onRemoveImage,
  onSearchAbort,
  setThinking,
}) => {
  return (
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
      {uploadedImages.length > 0 && (
        <Stack
          direction='row'
          flexWrap='wrap'
          gap={1}
          sx={{ width: '100%', zIndex: 1 }}
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
                style={{ objectFit: 'cover' }}
              />
              <IconButton
                size='small'
                onClick={() => onRemoveImage(image.id)}
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
        onChange={onInputChange}
        onFocus={onInputFocus}
        onBlur={onInputBlur}
        onPaste={onPaste}
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
            onSearch();
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
          onChange={onImageUpload}
        />
        <Tooltip title='敬请期待'>
          <IconButton size='small' disabled={loading} sx={{ flexShrink: 0 }}>
            <IconTupian sx={{ fontSize: 20, color: 'text.secondary' }} />
          </IconButton>
        </Tooltip>

        <Box sx={{ fontSize: 12, flexShrink: 0, cursor: 'pointer' }}>
          {loading ? (
            <ChatLoading
              thinking={thinking}
              onClick={() => {
                setThinking(4);
                onSearchAbort();
              }}
            />
          ) : (
            <IconButton
              size='small'
              onClick={() => {
                if (input.length > 0) {
                  onSearchAbort();
                  setThinking(1);
                  onSearch();
                }
              }}
            >
              <IconFasong
                sx={{
                  fontSize: 16,
                  color: input.length > 0 ? 'primary.main' : 'text.disabled',
                }}
              />
            </IconButton>
          )}
        </Box>
      </Stack>
    </Stack>
  );
};
