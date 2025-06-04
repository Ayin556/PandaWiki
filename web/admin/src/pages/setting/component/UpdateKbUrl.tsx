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

// 验证规则常量
const VALIDATION_RULES = {
  port: {
    required: {
      value: true,
      message: '端口不能为空',
    },
    min: {
      value: 1,
      message: '端口号不能小于1',
    },
    max: {
      value: 65535,
      message: '端口号不能大于65535',
    },
  },
  domain: {
    pattern: {
      value: /^(localhost|((([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)\.)+[a-zA-Z]{2,})|(\d{1,3}(?:\.\d{1,3}){3})|(\[[0-9a-fA-F:]+\]))$/,
      message: '请输入有效的域名、IP 或 localhost',
    },
  },
}

const UpdateKbUrl = ({ open, data, onCancel, refresh }: UpdateKbUrlProps) => {
  const { control, formState: { errors }, setValue, watch, handleSubmit } = useForm<KnowledgeBaseFormData>({
    defaultValues: {
      domain: '',
      http: false,
      https: false,
      port: 80,
      ssl_port: 443,
      httpsCert: '',
      httpsKey: '',
    }
  })

  const { http, https } = watch()

  useEffect(() => {
    if (open) {
      setValue('domain', data.access_settings.hosts?.[0] || '')
      setValue('http', (data.access_settings.ports?.length || 0) > 0)
      setValue('https', (data.access_settings.ssl_ports?.length || 0) > 0)
      setValue('port', data.access_settings.ports?.[0] || 80)
      setValue('ssl_port', data.access_settings.ssl_ports?.[0] || 443)
      setValue('httpsCert', data.access_settings.public_key || '')
      setValue('httpsKey', data.access_settings.private_key || '')
    }
  }, [open, data])

  const onSubmit = (value: KnowledgeBaseFormData) => {
    const formData: Partial<UpdateKnowledgeBaseData['access_settings']> = {}
    if (value.domain) formData.hosts = [value.domain]
    if (value.http) formData.ports = [+value.port]
    if (value.https) {
      formData.ssl_ports = [+value.ssl_port]
      if (value.httpsCert) formData.public_key = value.httpsCert
      else {
        Message.error('请上传证书文件')
        return
      }
      if (value.httpsKey) formData.private_key = value.httpsKey
      else {
        Message.error('请上传私钥文件')
        return
      }
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
        rules={VALIDATION_RULES.domain}
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
      <Box component={'label'} htmlFor='http' sx={{ width: 100, flexShrink: 0, cursor: 'pointer', fontSize: 14, color: http ? 'text.primary' : 'text.auxiliary' }}>启用 HTTP</Box>
      {http && <Controller
        control={control}
        name='port'
        rules={VALIDATION_RULES.port}
        render={({ field }) => <TextField
          {...field}
          label='端口'
          fullWidth
          type='number'
          value={+field.value || 80}
          error={!!errors.port}
          helperText={errors.port?.message}
        />}
      />}
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
      <Box component={'label'} htmlFor='https' sx={{ width: 100, flexShrink: 0, cursor: 'pointer', fontSize: 14, color: https ? 'text.primary' : 'text.auxiliary' }}>启用 HTTPS</Box>
      {https && <Controller
        control={control}
        name='ssl_port'
        rules={VALIDATION_RULES.port}
        render={({ field }) => <TextField
          {...field}
          label='端口'
          fullWidth
          type='number'
          value={+field.value || 443}
          error={!!errors.ssl_port}
          helperText={errors.ssl_port?.message}
        />}
      />}
    </Stack>
    {https && <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mt: 2 }}>
      <Controller
        control={control}
        name='httpsCert'
        render={({ field }) => <FileText
          {...field}
          tip={'SSL 证书文件'}
        />}
      />
      <Controller
        control={control}
        name='httpsKey'
        render={({ field }) => <FileText
          {...field}
          tip={'SSL 私钥文件'}
        />}
      />
    </Stack>}
  </Modal>
}

export default UpdateKbUrl