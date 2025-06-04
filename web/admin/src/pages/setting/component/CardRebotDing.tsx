import { AppDetail, DingBotSetting, getAppDetail, KnowledgeBaseListItem, updateAppDetail } from "@/api"
import ShowText from "@/components/ShowText"
import { Box, Button, Stack, TextField } from "@mui/material"
import { Message } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

const CardRebotDing = ({ kb }: { kb: KnowledgeBaseListItem }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [detail, setDetail] = useState<AppDetail | null>(null)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<DingBotSetting>({
    defaultValues: {
      dingtalk_bot_client_id: '',
      dingtalk_bot_token: '',
      dingtalk_bot_aes_key: '',
      dingtalk_bot_welcome_str: '',
    }
  })

  const getDetail = () => {
    getAppDetail({ kb_id: kb.id, type: 3 }).then(res => {
      setDetail(res)
      reset({
        dingtalk_bot_client_id: res.settings.dingtalk_bot_client_id,
        dingtalk_bot_token: res.settings.dingtalk_bot_token,
        dingtalk_bot_aes_key: res.settings.dingtalk_bot_aes_key,
        dingtalk_bot_welcome_str: res.settings.dingtalk_bot_welcome_str,
      })
    })
  }

  const onSubmit = (data: DingBotSetting) => {
    if (!detail) return
    updateAppDetail({ id: detail.id }, {
      settings: {
        dingtalk_bot_client_id: data.dingtalk_bot_client_id,
        dingtalk_bot_token: data.dingtalk_bot_token,
        dingtalk_bot_aes_key: data.dingtalk_bot_aes_key,
        dingtalk_bot_welcome_str: data.dingtalk_bot_welcome_str,
      }
    }).then(() => {
      Message.success('保存成功')
      setIsEdit(false)
      getDetail()
      reset()
    })
  }

  useEffect(() => {
    getDetail()
  }, [])

  return <>
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
      fontWeight: 'bold',
    }}>
      <Box sx={{
        '&::before': {
          content: '""',
          display: 'inline-block',
          width: 4,
          height: 12,
          bgcolor: 'common.black',
          borderRadius: '2px',
          mr: 1,
        },
      }}>钉钉机器人</Box>
      {isEdit && <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>}
    </Stack>
    <Box sx={{ m: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '32px', mb: 1 }}>
        回调地址
      </Box>
      <Stack gap={1}>
        {kb.access_settings?.hosts?.map((it: string) => {
          const url: string[] = []
          kb.access_settings.ports?.forEach(port => {
            if (port === 80) url.push(`http://${it}/share/v1/chat/dingtalk_bot`)
            else url.push(`http://${it}:${port}/share/v1/chat/dingtalk_bot`)
          })
          kb.access_settings.ssl_ports?.forEach(port => {
            if (port === 443) url.push(`https://${it}/share/v1/chat/dingtalk_bot`)
            else url.push(`https://${it}:${port}/share/v1/chat/dingtalk_bot`)
          })
          return url.map((it, index) => <ShowText
            key={index}
            text={it}
          />)
        })}
      </Stack>
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          ClientId
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-258e-7c3d-b26a-42e96aea068b' target="_blank">使用方法</Button>
      </Stack>
      <Controller
        control={control}
        name="dingtalk_bot_client_id"
        rules={{
          required: 'ClientId',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 钉钉开发平台 > 机器人配置 > 凭证与基础信息 > Client ID"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.dingtalk_bot_client_id}
          helperText={errors.dingtalk_bot_client_id?.message}
        />}
      />
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          AesKey
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-258e-7c3d-b26a-42e96aea068b' target="_blank">使用方法</Button>
      </Stack>
      <Controller
        control={control}
        name="dingtalk_bot_aes_key"
        rules={{
          required: 'AesKey',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 钉钉开发平台 > 机器人配置 > 事件订阅 > 加密 dingtalk_bot_aes_key"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.dingtalk_bot_aes_key}
          helperText={errors.dingtalk_bot_aes_key?.message}
        />}
      />
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          Token
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-258e-7c3d-b26a-42e96aea068b' target="_blank">使用方法</Button>
      </Stack>
      <Controller
        control={control}
        name="dingtalk_bot_token"
        rules={{
          required: 'Token',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 钉钉开发平台 > 机器人配置 > 事件订阅 > 签名 dingtalk_bot_token"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.dingtalk_bot_token}
          helperText={errors.dingtalk_bot_token?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        用户欢迎语
      </Box>
      <Controller
        control={control}
        name="dingtalk_bot_welcome_str"
        render={({ field }) => <TextField
          {...field}
          multiline
          rows={4}
          fullWidth
          size="small"
          placeholder={`欢迎使用网站监测 AI 助手，我将回答您关于网站监测的问题，如:\n 1. 网站监测的监控节点 IP 是什么 \n 2. 网站监测大模型落地案例`}
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.dingtalk_bot_welcome_str}
          helperText={errors.dingtalk_bot_welcome_str?.message}
        />}
      />
    </Box >
  </>
}

export default CardRebotDing