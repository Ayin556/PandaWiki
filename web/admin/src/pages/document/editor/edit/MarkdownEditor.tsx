import { Editor, UseTiptapReturn } from '@ctzhian/tiptap';
import { alpha, Box, Divider, Stack, useTheme } from '@mui/material';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import AceEditor from 'react-ace';

import { MARKDOWN_EDITOR_PLACEHOLDER } from '@/constant/markdown-placeholder';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-markdown';
import 'ace-builds/src-noconflict/theme-github';

interface MarkdownEditorProps {
  editor: UseTiptapReturn['editor'];
  value: string;
  onChange: (value: string) => void;
  header: React.ReactNode;
}

export interface MarkdownEditorRef {
  scrollToHeading: (headingText: string) => void;
}

const MarkdownEditor = forwardRef<MarkdownEditorRef, MarkdownEditorProps>(
  ({ editor, value, onChange, header }, ref) => {
    const theme = useTheme();
    const aceEditorRef = useRef<AceEditor>(null);
    const [displayMode, setDisplayMode] = useState<
      'edit' | 'preview' | 'split'
    >('split');

    useImperativeHandle(ref, () => ({
      scrollToHeading: (headingText: string) => {
        if (!aceEditorRef.current) return;

        const aceEditor = aceEditorRef.current.editor;
        const lines = value.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('#')) {
            const titleText = line.replace(/^#+\s*/, '').trim();
            if (titleText === headingText.trim()) {
              aceEditor.gotoLine(i + 1, 0, true);
              aceEditor.scrollToLine(i, false, true, () => {});
              break;
            }
          }
        }
      },
    }));

    return (
      <Box
        sx={{
          mt: '56px',
          px: 10,
          pt: 4,
          flex: 1,
        }}
      >
        <Box sx={{}}>{header}</Box>
        <Stack
          direction={'row'}
          alignItems={'stretch'}
          sx={{
            position: 'relative',
            flex: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Stack
            direction='row'
            sx={{
              position: 'absolute',
              p: 0.5,
              top: -32,
              left: -1,
              border: '1px solid',
              borderColor: 'divider',
              borderBottom: 'none',
              borderRadius: '4px 4px 0 0',
              fontSize: 12,
              color: 'text.tertiary',
              '.md-display-mode-active': {
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
              '& :hover:not(.md-display-mode-active)': {
                borderRadius: '4px',
                bgcolor: 'background.paper3',
              },
            }}
          >
            <Box
              className={
                displayMode === 'split' ? 'md-display-mode-active' : ''
              }
              sx={{ px: 1, py: 0.25, cursor: 'pointer', borderRadius: '4px' }}
              onClick={() => setDisplayMode('split')}
            >
              分屏模式
            </Box>
            <Box
              className={displayMode === 'edit' ? 'md-display-mode-active' : ''}
              sx={{ px: 1, py: 0.25, cursor: 'pointer', borderRadius: '4px' }}
              onClick={() => setDisplayMode('edit')}
            >
              编辑模式
            </Box>
            <Box
              className={
                displayMode === 'preview' ? 'md-display-mode-active' : ''
              }
              sx={{ px: 1, py: 0.25, cursor: 'pointer', borderRadius: '4px' }}
              onClick={() => setDisplayMode('preview')}
            >
              预览模式
            </Box>
          </Stack>
          {['edit', 'split'].includes(displayMode) && (
            <Stack
              direction='column'
              sx={{
                flex: 1,
                fontFamily: 'monospace',
                '.ace_placeholder': {
                  transform: 'scale(1)',
                  height: '100%',
                  overflow: 'auto',
                  width: '100%',
                },
              }}
            >
              <AceEditor
                ref={aceEditorRef}
                mode='markdown'
                theme='twilight'
                value={value}
                onChange={onChange}
                name='project-doc-editor'
                wrapEnabled={true}
                showPrintMargin={false}
                placeholder={MARKDOWN_EDITOR_PLACEHOLDER}
                fontSize={16}
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  showLineNumbers: true,
                  tabSize: 2,
                }}
                style={{
                  width: '100%',
                  height: 'calc(100vh - 56px)',
                }}
              />
            </Stack>
          )}
          {displayMode === 'split' && (
            <Divider orientation='vertical' flexItem />
          )}
          {['split', 'preview'].includes(displayMode) && (
            <Box
              id='markdown-preview-container'
              sx={{
                overflowY: 'scroll',
                flex: 1,
                p: 2,
                height: 'calc(100vh - 56px)',
              }}
            >
              <Editor editor={editor} />
            </Box>
          )}
        </Stack>
      </Box>
    );
  },
);

MarkdownEditor.displayName = 'MarkdownEditor';

export default MarkdownEditor;
