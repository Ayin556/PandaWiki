import { createKnowledgeBase, getKnowledgeBaseList, UpdateKnowledgeBaseData } from "@/api"
import { useAppDispatch, useAppSelector } from "@/store"
import { setKbC, setKbId, setKbList } from "@/store/slices/config"
import { CheckCircle } from "@mui/icons-material"
import { Box, Checkbox, Divider, Stack, TextField } from "@mui/material"
import { Message, Modal } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { useLocation } from "react-router-dom"
import Card from "../Card"
import FileText from "../UploadFile/FileText"

interface FormData {
  name: string
  domain: string
  http: boolean
  https: boolean
  httpsCert: string
  httpsKey: string
}

const KBCreate = () => {
  const dispatch = useAppDispatch()
  const { kb_c, kbList } = useAppSelector(state => state.config)

  const location = useLocation()
  const { pathname } = location

  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<FormData>({
    defaultValues: {
      name: '',
      domain: window.location.hostname,
      http: true,
      https: false,
      httpsCert: '',
      httpsKey: '',
    }
  })

  const http = watch('http')
  const https = watch('https')
  const domain = watch('domain')
  const name = watch('name')

  const onSubmit = (value: FormData) => {
    const formData: Partial<UpdateKnowledgeBaseData> = { name: value.name }
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

    createKnowledgeBase(formData).then(({ id }) => {
      Message.success('创建成功')
      setOpen(false)
      setSuccess(true)
      getKbList(id)
      dispatch(setKbC(false))
    }).finally(() => {
      setLoading(false)
    })
  }

  const getKbList = (id?: string) => {
    const kb_id = id || localStorage.getItem('kb_id') || ''
    getKnowledgeBaseList().then(res => {
      if (res.length > 0) {
        dispatch(setKbList(res))
        if (res.find(item => item.id === kb_id)) {
          dispatch(setKbId(kb_id))
        } else {
          dispatch(setKbId(res[0]?.id || ''))
        }
      } else {
        setOpen(true)
      }
    })
  }

  useEffect(() => {
    setOpen(kb_c)
  }, [kb_c])

  useEffect(() => {
    getKbList()
    dispatch(setKbC(false))
  }, [pathname])

  return <>
    <Modal
      title={<Stack direction='row' alignItems='center' gap={1}>
        <CheckCircle sx={{ color: 'success.main' }} />
        {name} 创建成功
      </Stack>}
      open={success}
      showCancel={false}
      okText='关闭'
      onCancel={() => {
        reset()
        setSuccess(false)
      }}
      onOk={() => {
        reset()
        setSuccess(false)
      }}
      closable={false}
      cancelText='关闭'
    >
      <Card sx={{ p: 2, fontSize: 14, bgcolor: 'background.paper2' }}>
        <Box sx={{ color: 'text.auxiliary', mb: 1 }}>打开以下地址访问前台网站</Box>
        {http && <Box>
          <Box
            component={'a'}
            href={`http://${domain}`}
            target='_blank'
            sx={{ fontFamily: 'Gbold', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
          >{`http://${domain}`}</Box>
        </Box>}
        {https && <Box>
          <Box
            component={'a'}
            href={`https://${domain}`}
            target='_blank'
            sx={{ fontFamily: 'Gbold', color: 'text.primary', '&:hover': { color: 'primary.main' } }}
          >{`https://${domain}`}</Box>
        </Box>}
      </Card>
    </Modal>
    <Modal
      open={open}
      onCancel={() => {
        reset()
        dispatch(setKbC(false))
        setOpen(false)
      }}
      okText={'创建'}
      onOk={handleSubmit(onSubmit)}
      disableEscapeKeyDown={kbList.length === 0}
      title={'创建知识库'}
      closable={kbList.length > 0}
      showCancel={kbList.length > 0}
      okButtonProps={{ loading, disabled: !(http || https) }}
    >
      <Box sx={{ mt: 1 }}>
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
            label={<Box>
              知识库名称
              <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
            </Box>}
            autoFocus
            fullWidth
            error={!!errors.name}
            helperText={errors.name?.message}
          />}
        />
      </Box>
      <Divider textAlign="left" sx={{ my: 2, fontSize: 14, lineHeight: '32px', color: 'text.auxiliary' }}>前台网站访问方式</Divider>
      <Box>
        <Controller
          control={control}
          name='domain'
          render={({ field }) => <TextField
            {...field}
            label='域名'
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
          render={({ field }) => <Checkbox
            {...field}
            id='http'
            checked={http}
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
          render={({ field }) => <Checkbox
            {...field}
            id='https'
            checked={https}
            size="small"
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
  </>
}

export default KBCreate