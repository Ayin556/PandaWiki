import { updateAppDetail } from "@/api"
import { AppDetail, StyleSetting } from "@/api/type"
import { Box, Button, FormControlLabel, MenuItem, Radio, RadioGroup, Select, Stack } from "@mui/material"
import { Message } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

interface CardStyleProps {
  id: string
  data: AppDetail
  refresh: (value: StyleSetting) => void
}

const CardStyle = ({ id, data, refresh }: CardStyleProps) => {
  const [isEdit, setIsEdit] = useState(false)
  const { control, handleSubmit, setValue } = useForm<StyleSetting>({
    defaultValues: {
      default_display_mode: 1,
      mode_switch_visible: 1,
      theme_mode: 'light',
    }
  })

  const onSubmit = (value: StyleSetting) => {
    updateAppDetail({ id }, {
      settings: {
        ...data.settings,
        ...value
      }
    }).then(() => {
      refresh(value)
      Message.success('保存成功')
      setIsEdit(false)
    })
  }

  useEffect(() => {
    setValue('default_display_mode', data.settings?.default_display_mode)
    setValue('mode_switch_visible', data.settings?.mode_switch_visible)
    setValue('theme_mode', data.settings?.theme_mode)
  }, [data])

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
      }}>样式与风格</Box>
      {isEdit && <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>}
    </Stack>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ mx: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '32px' }}>页面模式</Box>
      <Controller
        control={control}
        name="default_display_mode"
        render={({ field }) => <RadioGroup row {...field} onChange={(e) => {
          field.onChange(+e.target.value as 1 | 2)
          setIsEdit(true)
        }}>
          <FormControlLabel value={1} control={<Radio size='small' />} label={<Box sx={{ width: 120 }}>问答模式</Box>} />
          <FormControlLabel value={2} control={<Radio size='small' />} label={<Box sx={{ width: 120 }}>文档模式</Box>} />
        </RadioGroup>}
      />
    </Stack>
    <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ mx: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '32px' }}>页面模式切换按钮</Box>
      <Controller
        control={control}
        name="mode_switch_visible"
        render={({ field }) => <RadioGroup row {...field} onChange={(e) => {
          field.onChange(+e.target.value as 1 | 2)
          setIsEdit(true)
        }}>
          <FormControlLabel value={1} control={<Radio size='small' />} label={<Box sx={{ width: 120 }}>展示切换按钮</Box>} />
          <FormControlLabel value={2} control={<Radio size='small' />} label={<Box sx={{ width: 120 }}>隐藏切换按钮</Box>} />
        </RadioGroup>}
      />
    </Stack>
    <Box sx={{ fontSize: 14, lineHeight: '32px', mx: 2, mb: 1 }}>配色方案</Box>
    <Controller
      control={control}
      name="theme_mode"
      render={({ field }) => <Select
        {...field}
        sx={{ mx: 2, width: 'calc(100% - 32px)', height: 52 }}
        onChange={(e) => {
          field.onChange(e.target.value as 'light' | 'dark')
          setIsEdit(true)
        }}
      >
        <MenuItem value='light'>浅色模式</MenuItem>
        <MenuItem value='dark'>深色模式</MenuItem>
      </Select>}
    />
  </>
}

export default CardStyle