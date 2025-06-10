import { AppDetail, FeishuBotSetting, getAppDetail, KnowledgeBaseListItem, updateAppDetail } from "@/api"
import { Box, Button, Stack, TextField } from "@mui/material"
import { Message } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

const CardRebotFeishu = ({ kb }: { kb: KnowledgeBaseListItem }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [detail, setDetail] = useState<AppDetail | null>(null)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FeishuBotSetting>({
    defaultValues: {
      feishu_bot_app_id: '',
      feishu_bot_app_secret: '',
      feishu_bot_welcome_str: '',
    }
  })

  const getDetail = () => {
    getAppDetail({ kb_id: kb.id, type: 5 }).then(res => {
      setDetail(res)
      reset({
        feishu_bot_app_id: res.settings.feishu_bot_app_id,
        feishu_bot_app_secret: res.settings.feishu_bot_app_secret,
        feishu_bot_welcome_str: res.settings.feishu_bot_welcome_str,
      })
    })
  }

  const onSubmit = (data: FeishuBotSetting) => {
    if (!detail) return
    updateAppDetail({ id: detail.id }, {
      settings: {
        feishu_bot_app_id: data.feishu_bot_app_id,
        feishu_bot_app_secret: data.feishu_bot_app_secret,
        feishu_bot_welcome_str: data.feishu_bot_welcome_str,
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
      }}>飞书机器人</Box>
      {isEdit && <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>}
    </Stack>
    <Box sx={{ m: 2 }}>
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          App ID
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-4520-7c4b-8b4e-683ec5235adc' target="_blank">使用方法</Button>
      </Stack>
      <Controller
        control={control}
        name="feishu_bot_app_id"
        rules={{
          required: 'App ID',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 飞书开放平台 > 凭证与基础信息 > 应用凭证 > App ID"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.feishu_bot_app_id}
          helperText={errors.feishu_bot_app_id?.message}
        />}
      />
      <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
          App Secret
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        {/* <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-4520-7c4b-8b4e-683ec5235adc' target="_blank">使用方法</Button> */}
      </Stack>
      <Controller
        control={control}
        name="feishu_bot_app_secret"
        rules={{
          required: 'App Secret',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder="> 飞书开放平台 > 凭证与基础信息 > 应用凭证 > App Secret"
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.feishu_bot_app_secret}
          helperText={errors.feishu_bot_app_secret?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        用户欢迎语
      </Box>
      <Controller
        control={control}
        name="feishu_bot_welcome_str"
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
          error={!!errors.feishu_bot_welcome_str}
          helperText={errors.feishu_bot_welcome_str?.message}
        />}
      />
    </Box >
  </>
}

export default CardRebotFeishu