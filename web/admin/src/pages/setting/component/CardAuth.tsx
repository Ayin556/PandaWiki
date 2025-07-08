import { updateKnowledgeBase } from "@/api"
import { AuthSetting, KnowledgeBaseListItem } from "@/api/type"
import { Box, Button, FormControlLabel, Radio, RadioGroup, Stack, TextField } from "@mui/material"
import { Message } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

interface CardAuthProps {
  kb: KnowledgeBaseListItem
  refresh: (value: AuthSetting) => void
}

const CardAuth = ({ kb, refresh }: CardAuthProps) => {
  const [isEdit, setIsEdit] = useState(false)
  const { control, handleSubmit, setValue, watch } = useForm<AuthSetting>({
    defaultValues: {
      enabled: false,
      password: ''
    }
  })

  const enabled = watch('enabled')

  const onSubmit = (value: AuthSetting) => {
    updateKnowledgeBase({ id: kb.id, access_settings: { ...kb.access_settings, simple_auth: value } }).then(() => {
      refresh(value)
      Message.success('保存成功')
      setIsEdit(false)
    })
  }

  useEffect(() => {
    if (kb.access_settings?.simple_auth) {
      setValue('enabled', kb.access_settings.simple_auth.enabled ?? false)
      setValue('password', kb.access_settings.simple_auth.password ?? '')
    }
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
      }}>访问认证</Box>
      {isEdit && <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>}
    </Stack>
    <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mx: 2, mb: 2 }}>
      <Box sx={{ width: 156, fontSize: 14, lineHeight: '32px', flexShrink: 0 }}>可访问性</Box>
      <Controller
        control={control}
        name="enabled"
        render={({ field }) => <RadioGroup
          row {...field}
          value={field.value ? '2' : '1'}
          onChange={(e) => {
            field.onChange(e.target.value === '1' ? false : true)
            setIsEdit(true)
          }}
        >
          <FormControlLabel value={'1'} control={<Radio size='small' />} label={<Box sx={{ width: 100 }}>允许公开访问</Box>} />
          <FormControlLabel value={'2'} control={<Radio size='small' />} label={<Box sx={{ width: 100 }}>简单口令访问</Box>} />
          <FormControlLabel value={'3'} control={<Radio size='small' disabled />} label={<Box sx={{ width: 100 }}>企业级身份认证</Box>} />
        </RadioGroup>}
      />
    </Stack>
    {enabled && <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mx: 2 }}>
      <Box sx={{ width: 156, fontSize: 14, lineHeight: '32px', flexShrink: 0 }}>访问口令</Box>
      <Controller
        control={control}
        name="password"
        render={({ field }) => <TextField
          {...field}
          fullWidth
          onChange={(e) => {
            field.onChange(e.target.value)
            setIsEdit(true)
          }}
          placeholder="输入访问口令"
        />}
      />
    </Stack>}
  </>
}

export default CardAuth