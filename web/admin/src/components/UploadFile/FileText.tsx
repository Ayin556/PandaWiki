import { CheckCircle } from "@mui/icons-material"
import {
  Box,
  Stack,
  Typography,
  useTheme
} from '@mui/material'
import { Icon } from 'ct-mui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface FileTextProps {
  file?: File
  onChange: (text: string) => void
  accept?: string
  tip?: string
  size?: number
}

const FileText = ({
  file,
  onChange,
  accept,
  tip,
  size,
}: FileTextProps) => {
  const theme = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dropFiles, setDropFiles] = useState<File[]>(file ? [file] : [])

  const getFileText = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      if (size && file.size > size) {
        throw new Error(`文件大小超过限制 ${size} 字节`);
      }
      onChange(text);
    } catch (error) {
      onChange('');
    }
  }, [onChange, size]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setDropFiles(acceptedFiles)
      getFileText(acceptedFiles[0])
    }
  }, [dropFiles, getFileText, size])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? accept.split(',').reduce((acc: Record<string, string[]>, item) => {
      const [type, subtype] = item.trim().split('/')
      if (!acc[type]) acc[type] = []
      if (subtype) acc[type].push(subtype)
      return acc
    }, {}) : undefined,
    multiple: false,
    noClick: true,
    noKeyboard: true
  })

  useEffect(() => {
    setDropFiles(file ? [file] : [])
  }, [file])

  return (
    <Box sx={{ width: '100%' }}>
      <Stack
        alignItems='center'
        {...getRootProps()}
        sx={{
          border: '1px solid #fff',
          borderRadius: '10px',
          p: 2,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'primary.main' : 'background.paper2',
          cursor: 'pointer',
          '&:hover': {
            borderColor: theme.palette.text.primary
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input {...getInputProps()} />
        {dropFiles.length > 0 ? <CheckCircle sx={{ color: 'success.main', fontSize: 40, mb: 1 }} />
          : <Icon type='icon-shangchuan' sx={{ fontSize: 40, mb: 1, color: 'text.secondary' }} />}
        <Typography variant='body1' sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {dropFiles.length > 0 ? '文件已添加' : tip || '点击或拖拽文件到区域内'}
        </Typography>
      </Stack>
      <input
        type='file'
        ref={fileInputRef}
        hidden
        accept={accept}
        multiple={false}
        onChange={e => {
          if (e.target.files) {
            onDrop(Array.from(e.target.files))
          }
        }}
      />
    </Box>
  )
}

export default FileText