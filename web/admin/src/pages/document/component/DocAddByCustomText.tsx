import { createDoc, NodeDetail, updateDoc } from "@/api"
import { useAppSelector } from "@/store"
import { Box, TextField } from "@mui/material"
import { Message, Modal } from "ct-mui"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"

interface DocAddByCustomTextProps {
  open: boolean
  data?: NodeDetail | null
  onClose: () => void
  refresh?: () => void
  type?: 'docFile' | 'customDoc'
}
const DocAddByCustomText = ({ open, data, onClose, refresh, type = 'customDoc' }: DocAddByCustomTextProps) => {
  const { kb_id: id } = useAppSelector(state => state.config)
  const text = type === 'docFile' ? '文件夹' : '文档'

  const { control, handleSubmit, reset, formState: { errors } } = useForm<{ name: string }>({
    defaultValues: {
      name: '',
    }
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const submit = (value: { name: string }) => {
    if (data) {
      updateDoc({ id: data.id, name: value.name }).then(() => {
        Message.success('修改成功')
        reset()
        handleClose()
        refresh?.()
      })
    } else {
      if (!id) return
      createDoc({ name: value.name, content: '', kb_id: id, parent_id: null, type: type === 'docFile' ? 1 : 2 }).then(() => {
        Message.success('创建成功')
        reset()
        handleClose()
        refresh?.()
      })
    }
  }

  useEffect(() => {
    if (data) {
      reset({
        name: data.name || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return <Modal
    title={data ? `编辑${text}` : `创建${text}`}
    open={open}
    width={600}
    okText={data ? '保存' : '创建'}
    onCancel={handleClose}
    onOk={handleSubmit(submit)}
  >
    <Box sx={{ fontSize: 14, lineHeight: '36px' }}>
      {text}名称
    </Box>
    <Controller
      control={control}
      name="name"
      rules={{ required: `请输入${text}名称` }}
      render={({ field }) => (
        <TextField
          {...field}
          fullWidth
          autoFocus
          size="small"
          placeholder={`请输入${text}名称`}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
      )}
    />
  </Modal>
}


export default DocAddByCustomText