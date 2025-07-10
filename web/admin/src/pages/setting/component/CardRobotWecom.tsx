import { AppDetail, getAppDetail, KnowledgeBaseListItem, updateAppDetail, WecomBotSetting } from "@/api"
import ShowText from "@/components/ShowText"
import { Box, Button, Stack, TextField } from "@mui/material"
import { Message } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

const CardRobotWecom = ({ kb, url }: { kb: KnowledgeBaseListItem, url: string }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [detail, setDetail] = useState<AppDetail | null>(null)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<WecomBotSetting>({
    defaultValues: {
      wechat_app_agent_id: undefined,
      wechat_app_secret: '',
      wechat_app_token: '',
      wechat_app_encodingaeskey: '',
      wechat_app_corpid: '',
    }
  })

  const getDetail = () => {
    getAppDetail({ kb_id: kb.id, type: 5 }).then(res => {
      setDetail(res)
      reset({
        wechat_app_agent_id: res.settings.wechat_app_agent_id,
        wechat_app_secret: res.settings.wechat_app_secret,
        wechat_app_token: res.settings.wechat_app_token,
        wechat_app_encodingaeskey: res.settings.wechat_app_encodingaeskey,
        wechat_app_corpid: res.settings.wechat_app_corpid,
      })
    })
  }

  const onSubmit = (data: WecomBotSetting) => {
    if (!detail) return
    updateAppDetail({ id: detail.id }, {
      settings: {
        wechat_app_agent_id: data.wechat_app_agent_id,
        wechat_app_secret: data.wechat_app_secret,
        wechat_app_token: data.wechat_app_token,
        wechat_app_encodingaeskey: data.wechat_app_encodingaeskey,
        wechat_app_corpid: data.wechat_app_corpid,
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
  }, [kb])

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
          回调地址
        </Box>
        <Button size="small" component='a' href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-67e1-73c8-8582-82ccac49cc96' target="_blank">使用方法</Button>
      </Stack>
      <ShowText text={[`${url}/share/v1/app/wechat/app`]} />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Agent ID
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_app_agent_id"
        rules={{
          required: 'Agent ID',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder=""
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wechat_app_agent_id}
          helperText={errors.wechat_app_agent_id?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Corp ID
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_app_corpid"
        rules={{
          required: 'Corp ID',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder=""
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wechat_app_corpid}
          helperText={errors.wechat_app_corpid?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Corp Secret
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_app_secret"
        rules={{
          required: 'Corp Secret',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder=""
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wechat_app_secret}
          helperText={errors.wechat_app_secret?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Token
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_app_token"
        rules={{
          required: 'Suite Token',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder=""
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wechat_app_token}
          helperText={errors.wechat_app_token?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Encoding Aes Key
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_app_encodingaeskey"
        rules={{
          required: 'Suite Encoding Aes Key',
        }}
        render={({ field }) => <TextField
          {...field}
          fullWidth
          placeholder=""
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          error={!!errors.wechat_app_encodingaeskey}
          helperText={errors.wechat_app_encodingaeskey?.message}
        />}
      />
    </Box >
  </>
}

export default CardRobotWecom