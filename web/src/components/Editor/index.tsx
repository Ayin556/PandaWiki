import { DocDetail, updateDoc, uploadFile } from "@/api";
import { Message } from "@cx/ui";
import { Box } from "@mui/material";
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { Color } from '@tiptap/extension-color';
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import Table from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from '@tiptap/extension-text-style';
import { Typography } from "@tiptap/extension-typography";
import { Underline } from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { all, createLowlight } from 'lowlight';
import { TextSelection } from "prosemirror-state";
import { useEffect } from "react";
import { Markdown } from 'tiptap-markdown';
import EditorHeader from "./component/EditorHeader";
import EditorToolbar from "./component/EditorToolbar";
import FontSize from "./extension/FontSize";
import Link from "./extension/Link";
import Selection from "./extension/Selection";
import TabKeyExtension from "./extension/TabKey";
import TrailingNode from "./extension/TrailingNode";

const lowlight = createLowlight(all)

interface SimpleEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: any;
  detail: DocDetail | null;
  refresh?: () => void;
}

const SimpleEditor = ({ content, detail, refresh }: SimpleEditorProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
      },
      handleKeyDown: (view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
          event.preventDefault()
          handleSave()
          return true
        }
        if (event.key === 'Tab') {
          view.dispatch(view.state.tr.insertText('\t'))
        }
      },
      handlePaste: (_, event) => {
        const items = event.clipboardData?.items;
        if (!items || !items.length) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          if (item.type.indexOf('image') !== -1) {
            event.preventDefault();

            const file = item.getAsFile();
            if (!file) continue;
            const formData = new FormData();
            formData.append("file", file);

            uploadFile(formData)
              .then(res => {
                const imageUrl = location.origin + '/static-file/' + res.key;
                editor?.chain().focus().setImage({ src: imageUrl }).run();
                Message.success('图片上传成功');
              })
              .catch(error => {
                console.error('图片上传失败:', error);
                Message.error('图片上传失败');
              });

            return true;
          }
        }

        return false;
      },
      handleDrop: (view, event) => {
        if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length > 0) {
          const files = event.dataTransfer.files;

          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            if (file.type.startsWith('image/')) {
              event.preventDefault();

              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

              if (!coordinates) return false;

              const dropPosition = coordinates.pos;

              const formData = new FormData();
              formData.append("file", file);

              uploadFile(formData)
                .then(res => {
                  const imageUrl = location.origin + '/static-file/' + res.key;

                  if (editor) {
                    const { state } = editor.view;
                    const tr = state.tr.setSelection(TextSelection.near(state.doc.resolve(dropPosition)));
                    editor.view.dispatch(tr);

                    editor.chain().focus().setImage({ src: imageUrl }).run();
                    Message.success('图片上传成功');
                  }
                })
                .catch(error => {
                  console.error('图片上传失败:', error);
                  Message.error('图片上传失败');
                });

              return true;
            }
          }
        }

        return false;
      }
    },
    extensions: [
      StarterKit,
      Markdown,
      Color,
      Underline,
      TextStyle,
      TaskList,
      Image,
      Typography,
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 25,
        lastColumnResizable: false,
      }),
      TableRow,
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => ({
                style: attributes.style,
              }),
            },
          };
        },
      }),
      TableHeader,
      Superscript,
      Subscript,
      Selection,
      TrailingNode,
      FontSize,
      TabKeyExtension,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false }),
      TaskItem.configure({ nested: true }),
      Highlight.configure({
        multicolor: true,
        HTMLAttributes: {
          class: 'highlight-marker'
        }
      }),
    ],
    content: content,
  });

  const handleSave = () => {
    if (!detail || !editor) return
    updateDoc({ doc_id: detail.id, content: editor.getHTML() }).then(() => {
      Message.success('保存成功')
      refresh?.()
    })
  }

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }

  }, [content, editor])

  if (!editor) {
    return null;
  }

  return (
    <Box className="editor-container">
      <Box sx={{
        position: 'fixed',
        top: 0,
        width: '100vw',
        zIndex: 1,
        bgcolor: '#fff',
        boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
      }}
      >
        <Box sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 1,
        }}>
          <EditorHeader detail={detail} onSave={handleSave} refresh={refresh} />
        </Box>
        <EditorToolbar editor={editor} />
      </Box>
      <Box className='editor-content' sx={{
        bgcolor: '#fff',
        width: 800,
        margin: 'auto',
        minHeight: '100vh',
        overflowY: 'auto',
      }}>
        <EditorContent editor={editor} className="simple-editor-content" />
      </Box>
    </Box>
  );
};

export default SimpleEditor;