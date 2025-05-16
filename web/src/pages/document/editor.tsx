import { DocDetail, getDocDetail } from "@/api"
import '@/assets/styles/editor.css'
import Editor from "@/components/Editor"
import { Box } from "@mui/material"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

const DocEditor = () => {
  const { id = '' } = useParams()
  const [detail, setDetail] = useState<DocDetail | null>(null)
  const [content, setContent] = useState('')
  // const editor = useCurrentEditor()

  const getDetail = () => {
    getDocDetail({ doc_id: id }).then(res => {
      setContent(res.content || '')
      setDetail(res)
    })
  }

  useEffect(() => {
    if (id) {
      getDetail()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return <Box sx={{ color: 'text.primary' }}>
    <Editor content={content || ''} detail={detail} refresh={getDetail} />
  </Box>
}

export default DocEditor