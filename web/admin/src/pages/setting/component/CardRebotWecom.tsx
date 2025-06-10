import { AppDetail, getAppDetail, KnowledgeBaseListItem, updateAppDetail, WecomBotSetting } from "@/api"
import { Box, Button, Stack, TextField } from "@mui/material"
import { Message } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

const CardRebotWecom = ({ kb }: { kb: KnowledgeBaseListItem }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [detail, setDetail] = useState<AppDetail | null>(null)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<WecomBotSetting>({
    defaultValues: {
      wecom_bot_agent_id: undefined,
      wecom_bot_corp_secret: '',
      wecom_bot_suite_token: '',
      wecom_bot_suite_encoding_aes_key: '',
      wecom_bot_corp_id: '',
      wecom_bot_welcome_str: '',
    }
  })

  const getDetail = () => {
    getAppDetail({ kb_id: kb.id, type: 5 }).then(res => {
      setDetail(res)
      reset({
        wecom_bot_agent_id: res.settings.wecom_bot_agent_id,
        wecom_bot_corp_secret: res.settings.wecom_bot_corp_secret,
        wecom_bot_suite_token: res.settings.wecom_bot_suite_token,
        wecom_bot_suite_encoding_aes_key: res.settings.wecom_bot_suite_encoding_aes_key,
        wecom_bot_corp_id: res.settings.wecom_bot_corp_id,
        wecom_bot_welcome_str: res.settings.wecom_bot_welcome_str,
      })
    })
  }

  const onSubmit = (data: WecomBotSetting) => {
    if (!detail) return
    updateAppDetail({ id: detail.id }, {
      settings: {
        wecom_bot_agent_id: data.wecom_bot_agent_id,
        wecom_bot_corp_secret: data.wecom_bot_corp_secret,
        wecom_bot_suite_token: data.wecom_bot_suite_token,
        wecom_bot_suite_encoding_aes_key: data.wecom_bot_suite_encoding_aes_key,
        wecom_bot_corp_id: data.wecom_bot_corp_id,
        wecom_bot_welcome_str: data.wecom_bot_welcome_str,
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
      }}>企业微信机器人</Box>
      {isEdit && <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>}
    </Stack>
    <Box sx={{ m: 2 }}>
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          Agent ID
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-4520-7c4b-8b4e-683ec5235adc' target="_blank">使用方法</Button>
      </Stack>
      <Controller
        control={control}
        name="wecom_bot_agent_id"
        rules={{
          required: 'Agent ID',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 企业微信后台 > 应用设置 > AgentId"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wecom_bot_agent_id}
          helperText={errors.wecom_bot_agent_id?.message}
        />}
      />
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          Corp ID
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        {/* <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-4520-7c4b-8b4e-683ec5235adc' target="_blank">使用方法</Button> */}
      </Stack>
      <Controller
        control={control}
        name="wecom_bot_corp_id"
        rules={{
          required: 'Corp ID',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 企业微信后台 > 我的企业 > 企业 ID"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wecom_bot_corp_id}
          helperText={errors.wecom_bot_corp_id?.message}
        />}
      />
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          Corp Secret
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        {/* <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-4520-7c4b-8b4e-683ec5235adc' target="_blank">使用方法</Button> */}
      </Stack>
      <Controller
        control={control}
        name="wecom_bot_corp_secret"
        rules={{
          required: 'Corp Secret',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 企业微信后台 > 应用设置 > Secret"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wecom_bot_corp_secret}
          helperText={errors.wecom_bot_corp_secret?.message}
        />}
      />
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          Suite Token
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        {/* <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-4520-7c4b-8b4e-683ec5235adc' target="_blank">使用方法</Button> */}
      </Stack>
      <Controller
        control={control}
        name="wecom_bot_suite_token"
        rules={{
          required: 'Suite Token',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 企业微信后台 > 应用设置 > 接收消息 > API 设置 > SuiteToken"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wecom_bot_suite_token}
          helperText={errors.wecom_bot_suite_token?.message}
        />}
      />
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          Suite Encoding Aes Key
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        {/* <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-4520-7c4b-8b4e-683ec5235adc' target="_blank">使用方法</Button> */}
      </Stack>
      <Controller
        control={control}
        name="wecom_bot_suite_encoding_aes_key"
        rules={{
          required: 'Suite Encoding Aes Key',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 企业微信后台 > 应用设置 > 接收消息 > API 设置 > SuiteEncodingAesKey"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wecom_bot_suite_encoding_aes_key}
          helperText={errors.wecom_bot_suite_encoding_aes_key?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        用户欢迎语
      </Box>
      <Controller
        control={control}
        name="wecom_bot_welcome_str"
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
          error={!!errors.wecom_bot_welcome_str}
          helperText={errors.wecom_bot_welcome_str?.message}
        />}
      />
    </Box >
  </>
}

export default CardRebotWecom