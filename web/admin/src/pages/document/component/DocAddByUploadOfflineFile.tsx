import { createNode, uploadFile } from "@/api"
import Upload from "@/components/UploadFile/Drag"
import { useAppSelector } from "@/store"
import { formatByte } from "@/utils"
import { Close } from "@mui/icons-material"
import { Box, CircularProgress, IconButton, LinearProgress, List, ListItem, ListItemText, Stack, Typography, useTheme } from "@mui/material"
import { Message, Modal } from "ct-mui"
import { useState } from "react"
import { FileRejection } from "react-dropzone"

interface DocAddByUploadOfflineFileProps {
  open: boolean
  onClose: () => void
  refresh?: () => void
}

const DocAddByUploadOfflineFile = ({ open, onClose, refresh }: DocAddByUploadOfflineFileProps) => {
  const theme = useTheme()
  const { kb_id: id } = useAppSelector(state => state.config)

  const [acceptedFiles, setAcceptedFiles] = useState<File[]>([])
  const [rejectedFiles, setRejectedFiles] = useState<FileRejection[]>([])
  const [isUploading, setIsUploading] = useState(0)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [size] = useState(1024 * 1024 * 5)

  const onChangeFile = (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    setAcceptedFiles(acceptedFiles)
    setRejectedFiles(rejectedFiles)
    setIsUploading(0)
  }

  const handleRemove = (index: number) => {
    const newFiles = acceptedFiles.filter((_, i) => i !== index)
    setAcceptedFiles(newFiles)
  }

  const handleClose = () => {
    setAcceptedFiles([])
    setRejectedFiles([])
    setUploadProgress(0)
    setIsUploading(0)
    setCurrentFileIndex(0)
    onClose()
    refresh?.()
  }

  const handleUploadFile = async (file: File, onProgress: (progress: number) => void): Promise<string> => {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("kb_id", id)
    const response = await uploadFile(formData, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
        onProgress(percent)
      }
    })
    return response.key
  }

  const submit = async () => {
    if (isUploading === 1) return
    setIsUploading(1)
    setCurrentFileIndex(0)
    const urls: string[] = []
    const errorIdx: number[] = []

    try {
      for (let i = 0; i < acceptedFiles.length; i++) {
        setCurrentFileIndex(i)
        setUploadProgress(0)
        try {
          const url = await handleUploadFile(acceptedFiles[i], (progress) => {
            setUploadProgress(progress)
          })
          urls.push(url)
        } catch (error) {
          errorIdx.push(i)
          console.error(`文件 ${acceptedFiles[i].name} 上传失败:`, error)
        }
      }
      if (urls.length > 0 && id) {
        createNode({ kb_id: id, file_key: urls, source: 2 }).then(() => {
          const text = errorIdx.length === 0 ? '上传成功' : `已上传 ${urls.length} 个文件，${errorIdx.length} 个文件上传失败`
          Message.success(text)
          if (errorIdx.length === 0) handleClose()
          else {
            const newFiles = acceptedFiles.filter((_, i) => errorIdx.includes(i))
            onChangeFile(newFiles, rejectedFiles)
            setIsUploading(2)
          }
          refresh?.()
        })
      }
    } catch (error) {
      console.error(error)
    }
  }

  return <Modal
    title='上传离线文件'
    open={open}
    width={600}
    onCancel={handleClose}
    onOk={submit}
  >
    <Upload
      file={acceptedFiles}
      onChange={(accept, reject) => onChangeFile(accept, reject)}
      type='drag'
      multiple
      accept='.txt, .md, .xls, .xlsx, .docx, .pdf'
      size={size}
    />
    {isUploading === 1 && <Box sx={{ mt: 2 }}>
      <Box sx={{ fontSize: 14, mb: 1 }}>
        正在上传文件 {currentFileIndex + 1} / {acceptedFiles.length}
      </Box>
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} gap={2}>
        <Box sx={{ fontSize: 12 }}>
          {acceptedFiles[currentFileIndex]?.name}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
          <CircularProgress size={20} sx={{ mr: 1.5 }} />
          <Typography variant="body2">{uploadProgress}%</Typography>
        </Box>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={uploadProgress}
        sx={{
          height: '4px !important',
          borderRadius: 4,
          "& .MuiLinearProgress-bar": {
            borderRadius: 4,
          },
        }}
      />
    </Box>}
    {(acceptedFiles.length > 0 || rejectedFiles.length > 0) && (
      <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
        <List dense>
          {acceptedFiles.map((file, index) => {
            return <ListItem
              key={`${file.name}-${index}`}
              sx={{
                borderBottom: `1px dashed ${theme.palette.divider}`,
                ':hover': {
                  backgroundColor: 'background.paper2'
                }
              }}
              secondaryAction={
                isUploading === 2 ? <Box sx={{ color: 'error.main', fontSize: 12 }}>上传失败</Box>
                  : <IconButton edge='end' onClick={() => handleRemove(index)}>
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
              }
            >
              <ListItemText
                primary={file.name}
                secondary={formatByte(file.size)}
              />
              {size && file.size > size && (
                <Typography variant='caption' color='error' sx={{ ml: 2, fontSize: 12 }}>
                  超过大小限制
                </Typography>
              )}
            </ListItem>
          })}
          {rejectedFiles.map(({ file, errors }, index) => (
            <ListItem key={`reject-${index}`} sx={{ color: 'error.main', fontSize: 12 }}>
              <ListItemText
                primary={file.name}
                secondary={errors.map(e => e.message).join(', ')}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    )}
  </Modal>
}

export default DocAddByUploadOfflineFile