import { AppDetail, FeishuBotSetting, getAppDetail, updateAppDetail } from "@/api"
import Card from "@/components/Card"
import { addOpacityToColor } from "@/utils"
import { Ellipsis, Icon, Message, Modal } from "@cx/ui"
import { Box, Stack, TextField, useTheme } from "@mui/material"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
interface ConfigFeishuProps {
  id: string
  open: boolean
  onClose: () => void
  refresh: () => void
}

type ConfigFeishuForm = {
  name: string
} & FeishuBotSetting

const ConfigFeishu = ({ id, open, refresh, onClose }: ConfigFeishuProps) => {
  const theme = useTheme()
  const [detail, setDetail] = useState<AppDetail | null>(null)
  const { control, handleSubmit, formState: { errors }, reset } = useForm<ConfigFeishuForm>({
    defaultValues: {
      name: '',
      feishubot_app_id: '',
      feishubot_app_secret: '',
      feishubot_verification_token: '',
      feishubot_encrypt_key: '',
      feishubot_welcome_str: '',
    }
  })

  const onSubmit = (data: ConfigFeishuForm) => {
    updateAppDetail({ id }, {
      name: data.name,
      settings: {
        feishubot_app_id: data.feishubot_app_id,
        feishubot_app_secret: data.feishubot_app_secret,
        feishubot_verification_token: data.feishubot_verification_token,
        feishubot_encrypt_key: data.feishubot_encrypt_key,
        feishubot_welcome_str: data.feishubot_welcome_str,
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
          feishubot_app_id: res.settings.feishubot_app_id,
          feishubot_app_secret: res.settings.feishubot_app_secret,
          feishubot_verification_token: res.settings.feishubot_verification_token,
          feishubot_encrypt_key: res.settings.feishubot_encrypt_key,
          feishubot_welcome_str: res.settings.feishubot_welcome_str,
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
    title="飞书机器人配置"
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
      <Box component='a' href="https://docs.web2gpt.ai/zh/AI%E5%BA%94%E7%94%A8/%E9%A3%9E%E4%B9%A6%E6%9C%BA%E5%99%A8%E4%BA%BA" target="_blank">
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
      navigator.clipboard.writeText(`http://${window.location.host}/share/v1/app/feishubot/${detail.link}`)
      Message.success('复制成功')
    }}>
      <Stack direction={'row'} alignItems={'center'} gap={0.5}>
        <Icon type='icon-a-lianjie5' sx={{ fontSize: 16, color: 'text.auxiliary' }} />
        <Ellipsis sx={{ width: '100%' }}>
          {`http://${window.location.host}/share/v1/app/feishubot/${detail.link}`}
        </Ellipsis>
      </Stack>
    </Card>
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
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          AppId
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="feishubot_app_id"
          rules={{
            required: 'AppId',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="飞书开放平台 > 凭证与基础信息 > 应用凭证 > App ID"
            error={!!errors.feishubot_app_id}
            helperText={errors.feishubot_app_id?.message}
          />}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          AppSecret
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="feishubot_app_secret"
          rules={{
            required: 'AppSecret',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="飞书开放平台 > 凭证与基础信息 > 应用凭证 > App Secret"
            error={!!errors.feishubot_app_secret}
            helperText={errors.feishubot_app_secret?.message}
          />}
        />
      </Box>
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          VerificationToken
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="feishubot_verification_token"
          rules={{
            required: 'VerificationToken',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="飞书开放平台 > 事件与回调 > 事件订阅 > Verification Token"
            error={!!errors.feishubot_verification_token}
            helperText={errors.feishubot_verification_token?.message}
          />}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          EncryptKey
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="feishubot_encrypt_key"
          rules={{
            required: 'EncryptKey',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="飞书开放平台 > 事件与回调 > 事件订阅 > Encrypt Key"
            error={!!errors.feishubot_encrypt_key}
            helperText={errors.feishubot_encrypt_key?.message}
          />}
        />
      </Box>
    </Stack>
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
      用户欢迎语
    </Box>
    <Controller
      control={control}
      name="feishubot_welcome_str"
      render={({ field }) => <TextField
        {...field}
        multiline
        rows={4}
        fullWidth
        size="small"
        placeholder={`欢迎使用网站监测 AI 助手，我将回答您关于网站监测的问题，如:\n 1. 网站监测的监控节点 IP 是什么 \n 2. 网站监测大模型落地案例`}
        error={!!errors.feishubot_welcome_str}
        helperText={errors.feishubot_welcome_str?.message}
      />}
    />
  </Modal>
}

export default ConfigFeishu