import { createKnowledgeBase, KnowledgeBaseListItem, updateKnowledgeBase } from "@/api"
import { useAppDispatch, useAppSelector } from "@/store"
import { setKbList } from "@/store/slices/config"
import { Message, Modal } from "@cx/ui"
import { Box, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

interface EditKBProps {
  open: boolean
  data?: KnowledgeBaseListItem
  refresh: (id?: string) => void
  onClose: () => void
}

const KBEdit = ({ open, onClose, data, refresh }: EditKBProps) => {
  const dispatch = useAppDispatch()
  const { kbList } = useAppSelector(state => state.config)
  const [loading, setLoading] = useState(false)
  const { control, handleSubmit, formState: { errors }, setValue, reset } = useForm({
    defaultValues: {
      name: data?.name || '',
    }
  })

  const onSubmit = (value: { name: string }) => {
    setLoading(true)
    if (data?.id) {
      updateKnowledgeBase({ id: data.id, name: value.name }).then(() => {
        Message.success('更新成功')
        dispatch(setKbList(kbList.map(item => item.id === data.id ? { ...item, name: value.name } : item)))
        onClose()
        refresh()
        reset()
      }).finally(() => {
        setLoading(false)
      })
    } else {
      createKnowledgeBase({ name: value.name }).then(({ id }) => {
        Message.success('创建成功')
        onClose()
        reset()
        refresh(id)
      }).finally(() => {
        setLoading(false)
      })
    }
  }

  useEffect(() => {
    if (open && data) {
      setValue('name', data.name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, open])

  return <Modal
    open={open}
    onCancel={() => {
      onClose()
      reset()
    }}
    onOk={handleSubmit(onSubmit)}
    title={data ? '设置知识库' : '创建知识库'}
    okButtonProps={{ loading }}
  >
    <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
      知识库名称 <Box component={'span'} sx={{ color: 'red' }}>*</Box>
    </Box>
    <Controller
      control={control}
      name='name'
      rules={{
        required: {
          value: true,
          message: '知识库名称不能为空',
        },
      }}
      render={({ field }) => <TextField
        {...field}
        fullWidth
        size='small'
        error={!!errors.name}
        helperText={errors.name?.message}
      />}
    />
  </Modal>
}

export default KBEdit