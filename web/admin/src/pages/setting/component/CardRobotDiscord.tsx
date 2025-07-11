import { AppDetail, DiscordBotSetting, getAppDetail, KnowledgeBaseListItem, updateAppDetail } from "@/api"
import { Box, Button, Link, Stack, TextField } from "@mui/material"
import { Message } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

const CardRobotDiscord = ({ kb }: { kb: KnowledgeBaseListItem }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [detail, setDetail] = useState<AppDetail | null>(null)

  const { control, handleSubmit, formState: { errors }, reset } = useForm<DiscordBotSetting>({
    defaultValues: {
      discord_bot_token: '',
    }
  })

  const getDetail = () => {
    getAppDetail({ kb_id: kb.id, type: 7 }).then(res => {
      setDetail(res)
      reset({
        discord_bot_token: res.settings.discord_bot_token,
      })
    })
  }

  const onSubmit = (data: DiscordBotSetting) => {
    if (!detail) return
    updateAppDetail({ id: detail.id }, {
      settings: {
        discord_bot_token: data.discord_bot_token,
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
      }}>Discord 机器人</Box>
      <Box sx={{ flexGrow: 1, ml: 1 }}>
        <Link
          component='a' 
          href='https://pandawiki.docs.baizhi.cloud/node/0197d4e2-b5d9-7903-b12b-66e12cf2f715' 
          target="_blank"
          sx={{
            fontSize: 14,
            textDecoration: 'none',
            fontWeight: 'normal',
            '&:hover': {
              fontWeight: 'bold',
            }
          }}>使用方法</Link>
      </Box>
      {isEdit && <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>}
    </Stack>
    <Stack gap={2} sx={{ m: 2 }}>
      <Stack direction='row' gap={2} alignItems={'center'} justifyContent={'space-between'}>
        <Box sx={{ width: 156, fontSize: 14, lineHeight: '32px', flexShrink: 0 }}>
          Token
          <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
        </Box>
        <Controller
          control={control}
          name="discord_bot_token"
          rules={{
            required: 'Token',
          }}
          render={({ field }) => <TextField
            {...field}
            fullWidth
            placeholder="在 Discord 中创建机器人，并获取 Token"
            onChange={(e) => {
              field.onChange(e.target.value)
              setIsEdit(true)
            }}
            error={!!errors.discord_bot_token}
            helperText={errors.discord_bot_token?.message}
          />}
        />     
       </Stack>

    </Stack >
  </>
}

export default CardRobotDiscord
