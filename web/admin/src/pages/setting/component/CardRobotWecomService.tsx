import { AppDetail, getAppDetail, KnowledgeBaseListItem, updateAppDetail, WecomBotServiceSetting } from "@/api"
import ShowText from "@/components/ShowText"
import { Box, Button, Stack, TextField } from "@mui/material"
import { Message } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

const CardRobotWecomService = ({ kb, url }: { kb: KnowledgeBaseListItem, url: string }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [detail, setDetail] = useState<AppDetail | null>(null)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<WecomBotServiceSetting>({
    defaultValues: {
      wechat_service_secret: '',
      wechat_service_token: '',
      wechat_service_encodingaeskey: '',
      wechat_service_corpid: '',
    }
  })

  const getDetail = () => {
    getAppDetail({ kb_id: kb.id, type: 6 }).then(res => {
      setDetail(res)
      reset({
        wechat_service_secret: res.settings.wechat_service_secret,
        wechat_service_token: res.settings.wechat_service_token,
        wechat_service_encodingaeskey: res.settings.wechat_service_encodingaeskey,
        wechat_service_corpid: res.settings.wechat_service_corpid,
      })
    })
  }

  const onSubmit = (data: WecomBotServiceSetting) => {
    if (!detail) return
    updateAppDetail({ id: detail.id }, {
      settings: {
        wechat_service_secret: data.wechat_service_secret,
        wechat_service_token: data.wechat_service_token,
        wechat_service_encodingaeskey: data.wechat_service_encodingaeskey,
        wechat_service_corpid: data.wechat_service_corpid,
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
      }}>企业微信客服</Box>
      {isEdit && <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>}
    </Stack>
    <Box sx={{ m: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        回调地址
      </Box>
      <ShowText text={[`${url}/share/v1/app/wechat/service`]} />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Corp ID
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_service_corpid"
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
          error={!!errors.wechat_service_corpid}
          helperText={errors.wechat_service_corpid?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Corp Secret
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_service_secret"
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
          error={!!errors.wechat_service_secret}
          helperText={errors.wechat_service_secret?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Token
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_service_token"
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
          error={!!errors.wechat_service_token}
          helperText={errors.wechat_service_token?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
        Encoding Aes Key
        <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
      </Box>
      <Controller
        control={control}
        name="wechat_service_encodingaeskey"
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
          error={!!errors.wechat_service_encodingaeskey}
          helperText={errors.wechat_service_encodingaeskey?.message}
        />}
      />
    </Box>
  </>
}

export default CardRobotWecomService