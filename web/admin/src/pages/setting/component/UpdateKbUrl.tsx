import { KnowledgeBaseFormData, KnowledgeBaseListItem, updateKnowledgeBase, UpdateKnowledgeBaseData } from "@/api"
import FileText from "@/components/UploadFile/FileText"
import { Box, Checkbox, Stack, TextField } from "@mui/material"
import { Message, Modal } from "ct-mui"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"

interface UpdateKbUrlProps {
  open: boolean
  data: KnowledgeBaseListItem
  onCancel: () => void
  refresh: () => void
}

const UpdateKbUrl = ({ open, data, onCancel, refresh }: UpdateKbUrlProps) => {
  const { control, formState: { errors }, setValue, watch, handleSubmit } = useForm<KnowledgeBaseFormData>({
    defaultValues: {
      domain: '',
      http: false,
      https: false,
      httpsCert: '',
      httpsKey: '',
    }
  })

  const { http, https } = watch()

  useEffect(() => {
    if (open) {
      setValue('domain', data.access_settings.hosts?.[0] ?? '')
      setValue('http', data.access_settings.ports?.includes(80) ?? false)
      setValue('https', data.access_settings.ssl_ports?.includes(443) ?? false)
      setValue('httpsCert', data.access_settings.public_key ?? '')
      setValue('httpsKey', data.access_settings.private_key ?? '')
    }
  }, [open, data])

  const onSubmit = (value: KnowledgeBaseFormData) => {
    const formData: Partial<UpdateKnowledgeBaseData['access_settings']> = {}
    if (value.domain) formData.hosts = [value.domain]
    if (value.http) formData.ports = [80]
    if (value.https) formData.ssl_ports = [443]
    if (value.httpsCert) formData.public_key = value.httpsCert
    else if (https) {
      Message.error('请上传证书文件')
      return
    }
    if (value.httpsKey) formData.private_key = value.httpsKey
    else if (https) {
      Message.error('请上传私钥文件')
      return
    }
    updateKnowledgeBase({ id: data.id, access_settings: formData }).then(() => {
      Message.success('更新成功')
      refresh()
      onCancel()
    })
  }

  return <Modal
    open={open}
    onCancel={onCancel}
    title='修改前台网址访问方式'
    onOk={handleSubmit(onSubmit)}
  >
    <Box>
      <Box sx={{ fontSize: 14, lineHeight: '32px', mb: 1 }}>域名</Box>
      <Controller
        control={control}
        name='domain'
        render={({ field }) => <TextField
          {...field}
          fullWidth
          error={!!errors.domain}
          helperText={errors.domain?.message}
        />}
      />
    </Box>
    <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 2.5 }}>
      <Controller
        control={control}
        name='http'
        render={({ field: { value, onChange, ...field } }) => <Checkbox
          {...field}
          id='http'
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          size="small"
          sx={{ p: 0 }}
        />}
      />
      <Box component={'label'} htmlFor='http' sx={{ cursor: 'pointer', fontSize: 14, color: http ? 'text.primary' : 'text.auxiliary' }}>启用 HTTP，默认使用 80 端口</Box>
    </Stack>
    <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 1.5 }}>
      <Controller
        control={control}
        name='https'
        render={({ field: { value, onChange, ...field } }) => <Checkbox
          {...field}
          id='https'
          size="small"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
          sx={{ p: 0 }}
        />}
      />
      <Box component={'label'} htmlFor='https' sx={{ cursor: 'pointer', fontSize: 14, color: https ? 'text.primary' : 'text.auxiliary' }}>启用 HTTPS，默认使用 443 端口</Box>
    </Stack>
    {https && <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 2 }}>
      <Controller
        control={control}
        name='httpsCert'
        render={({ field }) => <FileText
          {...field}
          tip={'证书文件'}
        />}
      />
      <Controller
        control={control}
        name='httpsKey'
        render={({ field }) => <FileText
          {...field}
          tip={'私钥文件'}
        />}
      />
    </Stack>}
  </Modal>
}

export default UpdateKbUrl