import { createDoc, DocDetail, DocListItem, updateDoc } from "@/api"
import { useAppSelector } from "@/store"
import { Box, TextField } from "@mui/material"
import { Message, Modal } from "ct-mui"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"

interface DocAddByCustomTextProps {
  open: boolean
  data?: DocListItem | DocDetail | null
  onClose: () => void
  refresh?: () => void
}
const DocAddByCustomText = ({ open, data, onClose, refresh }: DocAddByCustomTextProps) => {
  const { kb_id: id } = useAppSelector(state => state.config)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<{ title: string }>({
    defaultValues: {
      title: '',
    }
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const submit = (value: { title: string }) => {
    if (data) {
      updateDoc({ doc_id: data.id, title: value.title }).then(() => {
        Message.success('修改成功')
        reset()
        handleClose()
        refresh?.()
      })
    } else {
      if (!id) return
      createDoc({ title: value.title, content: '', source: 3, kb_id: id }).then(() => {
        Message.success('录入成功')
        reset()
        handleClose()
        refresh?.()
      })
    }
  }

  useEffect(() => {
    if (data) {
      reset({
        title: 'title' in data ? data.title : data.meta.title || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return <Modal
    title={data ? '编辑文档' : '创建文档'}
    open={open}
    width={600}
    okText={data ? '保存' : '创建'}
    onCancel={handleClose}
    onOk={handleSubmit(submit)}
  >
    <Box sx={{ fontSize: 14, lineHeight: '36px' }}>
      标题
    </Box>
    <Controller
      control={control}
      name="title"
      rules={{ required: '请输入标题' }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          autoFocus
          size="small"
          placeholder="请输入标题"
          error={!!errors.title}
          helperText={errors.title?.message}
        />
      )}
    />
  </Modal>
}


export default DocAddByCustomText