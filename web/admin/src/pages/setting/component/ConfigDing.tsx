import { AppDetail, DingBotSetting, getAppDetail, updateAppDetail } from "@/api"
import Card from "@/components/Card"
import { addOpacityToColor, copyText } from "@/utils"
import { Box, Stack, TextField, useTheme } from "@mui/material"
import { Ellipsis, Icon, Message, Modal } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

interface ConfigDingProps {
  id: string
  open: boolean
  onClose: () => void
  refresh: () => void
}

type ConfigDingForm = {
  name: string
} & DingBotSetting

const ConfigDing = ({ id, open, refresh, onClose }: ConfigDingProps) => {
  const theme = useTheme()
  const [detail, setDetail] = useState<AppDetail | null>(null)
  const { control, handleSubmit, formState: { errors }, reset } = useForm<ConfigDingForm>({
    defaultValues: {
      name: '',
      dingbot_client_id: '',
      dingbot_token: '',
      dingbot_aes_key: '',
      dingbot_welcome_str: '',
    }
  })

  const onSubmit = (data: ConfigDingForm) => {
    updateAppDetail({ id }, {
      name: data.name,
      settings: {
        dingbot_client_id: data.dingbot_client_id,
        dingbot_token: data.dingbot_token,
        dingbot_aes_key: data.dingbot_aes_key,
        dingbot_welcome_str: data.dingbot_welcome_str,
      }
    }).then(() => {
      Message.success('保存成功')
      onClose()
      reset()
      refresh()
    })
  }

  useEffect(() => {
    if (open) {
      getAppDetail({ id }).then(res => {
        reset({
          name: res.name,
          dingbot_client_id: res.settings.dingbot_client_id,
          dingbot_token: res.settings.dingbot_token,
          dingbot_aes_key: res.settings.dingbot_aes_key,
          dingbot_welcome_str: res.settings.dingbot_welcome_str,
        })
        setDetail(res)
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, open])

  if (!detail) return null

  return <Modal
    open={open}
    width={800}
    onCancel={() => {
      onClose()
      reset()
    }}
    title="钉钉机器人配置"
    onOk={handleSubmit(onSubmit)}
  >
    <Stack direction={'row'} alignItems={'center'} sx={{
      px: 2,
      py: 1,
      bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
      borderRadius: '10px',
      fontSize: 14
    }}>
      <Icon type='icon-jinggao' sx={{ fontSize: 16, color: 'primary.main', mr: 0.5 }} />
      <Box>如何使用？</Box>
      <Box component='a' href="https://docs.web2gpt.ai/zh/AI%E5%BA%94%E7%94%A8/%E9%92%89%E9%92%89%E6%9C%BA%E5%99%A8%E4%BA%BA" target="_blank">
        查看教程
      </Box>
    </Stack>
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
      回调地址
    </Box>
    <Card sx={{
      bgcolor: 'background.paper2',
      fontSize: 12,
      px: 2,
      height: '36px',
      lineHeight: '36px',
      fontFamily: 'monospace',
      wordBreak: 'break-all',
      cursor: 'pointer',
      '&:hover': {
        color: 'primary.main',
      }
    }} onClick={() => {
      copyText(`http://${window.location.host}/share/v1/app/dingbot/${detail.link}`)
    }}>
      <Stack direction={'row'} alignItems={'center'} gap={0.5}>
        <Icon type='icon-a-lianjie5' sx={{ fontSize: 16, color: 'text.auxiliary' }} />
        <Ellipsis sx={{ width: '100%' }}>
          {`http://${window.location.host}/share/v1/app/dingbot/${detail.link}`}
        </Ellipsis>
      </Stack>
    </Card>
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
          应用名称
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="name"
          rules={{
            required: '应用名称',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            placeholder="输入应用名称"
            size="small"
            error={!!errors.name}
            helperText={errors.name?.message}
          />}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
          ClientId
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="dingbot_client_id"
          rules={{
            required: 'ClientId',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="> 钉钉开发平台 > 机器人配置 > 凭证与基础信息 > Client ID"
            error={!!errors.dingbot_client_id}
            helperText={errors.dingbot_client_id?.message}
          />}
        />
      </Box>
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
          AesKey
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="dingbot_aes_key"
          rules={{
            required: 'AesKey',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="> 钉钉开发平台 > 机器人配置 > 事件订阅 > 加密 dingbot_aes_key"
            error={!!errors.dingbot_aes_key}
            helperText={errors.dingbot_aes_key?.message}
          />}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
          Token
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="dingbot_token"
          rules={{
            required: 'Token',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="> 钉钉开发平台 > 机器人配置 > 事件订阅 > 签名 dingbot_token"
            error={!!errors.dingbot_token}
            helperText={errors.dingbot_token?.message}
          />}
        />
      </Box>
    </Stack>
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
      用户欢迎语
    </Box>
    <Controller
      control={control}
      name="dingbot_welcome_str"
      render={({ field }) => <TextField
        {...field}
        multiline
        rows={4}
        fullWidth
        size="small"
        placeholder={`欢迎使用网站监测 AI 助手，我将回答您关于网站监测的问题，如:\n 1. 网站监测的监控节点 IP 是什么 \n 2. 网站监测大模型落地案例`}
        error={!!errors.dingbot_welcome_str}
        helperText={errors.dingbot_welcome_str?.message}
      />}
    />
  </Modal>
}

export default ConfigDing