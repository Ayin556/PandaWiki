import { getNodeDetail, NodeDetail, updateNode, uploadFile } from "@/api";
import { Box } from "@mui/material";
import { Message } from "ct-mui";
import { TiptapEditor, TiptapToolbar, useTiptapEditor } from 'ct-tiptap-editor';
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import EditorHeader from "./component/EditorHeader";

const DocEditor = () => {
  const { id = '' } = useParams()
  const [detail, setDetail] = useState<NodeDetail | null>(null)

  const getDetail = () => {
    getNodeDetail({ id }).then(res => {
      setDetail(res)
    })
  }

  const handleSave = () => {
    if (!editorRef) return
    const { editor } = editorRef
    const content = editor.getHTML()
    updateNode({ id, content }).then(() => {
      Message.success('保存成功')
      getDetail()
    })
  }

  const handleImageUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { key } = await uploadFile(formData)
    return Promise.resolve('/static-file/' + key)
  }

  const editorRef = useTiptapEditor({
    content: '',
    onSave: handleSave,
    onImageUpload: handleImageUpload,
  })

  useEffect(() => {
    if (detail) {
      editorRef?.setContent(detail.content)
    }
  }, [detail])

  useEffect(() => {
    if (id) getDetail()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!editorRef) return null

  return <Box sx={{ color: 'text.primary' }}>
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
        <EditorHeader editorRef={editorRef} detail={detail} onSave={handleSave} refresh={getDetail} />
      </Box>
      <TiptapToolbar editorRef={editorRef} />
    </Box>
    <Box className='editor-content' sx={{
      width: 800,
      margin: 'auto',
      overflowY: 'auto',
      '.editor-container': {
        mt: '101px',
        borderRadius: '4px',
        bgcolor: '#fff',
        minHeight: 'calc(100vh - 101px)',
        '.tiptap': {
          minHeight: 'calc(100vh - 101px)',
        }
      }
    }}>
      <TiptapEditor editorRef={editorRef} />
    </Box>
  </Box>
}

export default DocEditor