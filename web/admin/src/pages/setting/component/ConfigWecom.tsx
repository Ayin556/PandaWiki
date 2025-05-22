import { AppDetail, getAppDetail, updateAppDetail, WecomBotSetting } from "@/api"
import Card from "@/components/Card"
import { addOpacityToColor, copyText } from "@/utils"
import { Box, Stack, TextField, useTheme } from "@mui/material"
import { Ellipsis, Icon, Message, Modal } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
interface ConfigWecomProps {
  id: string
  open: boolean
  onClose: () => void
  refresh: () => void
}

type ConfigWecomForm = {
  name: string
} & WecomBotSetting

const ConfigWecom = ({ id, open, refresh, onClose }: ConfigWecomProps) => {
  const theme = useTheme()
  const [detail, setDetail] = useState<AppDetail | null>(null)
  const { control, handleSubmit, formState: { errors }, reset } = useForm<ConfigWecomForm>({
    defaultValues: {
      name: '',
      wecombot_agent_id: undefined,
      wecombot_corp_secret: '',
      wecombot_suite_token: '',
      wecombot_suite_encoding_aes_key: '',
      wecombot_corp_id: '',
      wecombot_welcome_str: '',
    }
  })

  const onSubmit = (data: ConfigWecomForm) => {
    updateAppDetail({ id }, {
      name: data.name,
      settings: {
        wecombot_agent_id: Number(data.wecombot_agent_id),
        wecombot_corp_secret: data.wecombot_corp_secret,
        wecombot_suite_token: data.wecombot_suite_token,
        wecombot_suite_encoding_aes_key: data.wecombot_suite_encoding_aes_key,
        wecombot_corp_id: data.wecombot_corp_id,
        wecombot_welcome_str: data.wecombot_welcome_str,
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
          wecombot_agent_id: res.settings.wecombot_agent_id ? Number(res.settings.wecombot_agent_id) : undefined,
          wecombot_corp_id: res.settings.wecombot_corp_id || '',
          wecombot_corp_secret: res.settings.wecombot_corp_secret || '',
          wecombot_suite_token: res.settings.wecombot_suite_token || '',
          wecombot_suite_encoding_aes_key: res.settings.wecombot_suite_encoding_aes_key || '',
          wecombot_welcome_str: res.settings.wecombot_welcome_str || '',
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
    title="企业微信机器人配置"
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
      <Box component='a' href="https://docs.web2gpt.ai/zh/AI%E5%BA%94%E7%94%A8/%E4%BC%81%E4%B8%9A%E5%BE%AE%E4%BF%A1%E6%9C%BA%E5%99%A8%E4%BA%BA" target="_blank">
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
      copyText(`http://${window.location.host}/share/v1/app/wecombot/${detail.link}`)
    }}>
      <Stack direction={'row'} alignItems={'center'} gap={0.5}>
        <Icon type='icon-a-lianjie5' sx={{ fontSize: 16, color: 'text.auxiliary' }} />
        <Ellipsis sx={{ width: '100%' }}>
          {`http://${window.location.host}/share/v1/app/wecombot/${detail.link}`}
        </Ellipsis>
      </Stack>
    </Card>
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
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
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          AgentId
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="wecombot_agent_id"
          rules={{
            required: 'AgentId',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            type="number"
            size="small"
            placeholder="企业微信后台 > 应用设置 > AgentId"
            error={!!errors.wecombot_agent_id}
            helperText={errors.wecombot_agent_id?.message}
          />}
        />
      </Box>
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          CorpId
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="wecombot_corp_id"
          rules={{
            required: 'CorpId',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="企业微信后台 > 我的企业 > 企业 ID"
            error={!!errors.wecombot_corp_id}
            helperText={errors.wecombot_corp_id?.message}
          />}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          CorpSecret
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="wecombot_corp_secret"
          rules={{
            required: 'CorpSecret',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="企业微信后台 > 应用设置 > Secret"
            error={!!errors.wecombot_corp_secret}
            helperText={errors.wecombot_corp_secret?.message}
          />}
        />
      </Box>
    </Stack>
    <Stack direction={'row'} alignItems={'center'} gap={2} sx={{ mt: 2 }}>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          SuiteToken
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="wecombot_suite_token"
          rules={{
            required: 'SuiteToken',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="企微后台 > 应用设置 > 接收消息 > API 设置 > SuiteToken"
            error={!!errors.wecombot_suite_token}
            helperText={errors.wecombot_suite_token?.message}
          />}
        />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box sx={{ mb: '6px', fontSize: 14, lineHeight: '32px' }}>
          SuiteEncodingAesKey
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="wecombot_suite_encoding_aes_key"
          rules={{
            required: 'SuiteEncodingAesKey',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            size="small"
            placeholder="企微后台 > 应用设置 > 接收消息 > API 设置 > SuiteEncodingAesKey"
            error={!!errors.wecombot_suite_encoding_aes_key}
            helperText={errors.wecombot_suite_encoding_aes_key?.message}
          />}
        />
      </Box>
    </Stack>
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
      用户欢迎语
    </Box>
    <Controller
      control={control}
      name="wecombot_welcome_str"
      render={({ field }) => <TextField
        {...field}
        multiline
        rows={4}
        fullWidth
        size="small"
        placeholder={`欢迎使用网站监测 AI 助手，我将回答您关于网站监测的问题，如:\n 1. 网站监测的监控节点 IP 是什么 \n 2. 网站监测大模型落地案例`}
        error={!!errors.wecombot_welcome_str}
        helperText={errors.wecombot_welcome_str?.message}
      />}
    />
  </Modal>
}

export default ConfigWecom