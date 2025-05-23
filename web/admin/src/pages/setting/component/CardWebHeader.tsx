import Avatar from "@/components/Avatar"
import UploadFile from "@/components/UploadFile"
import { Box, Button, Checkbox, FormControl, FormControlLabel, IconButton, Radio, RadioGroup, Stack, TextField } from "@mui/material"
import { Icon } from "ct-mui"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

interface CardWebHeaderBtn {
  url: string
  variant: 'contained' | 'outlined',
  showIcon: boolean
  icon: string
  text: string
  target: '_blank' | '_self'
}

interface CardWebHeaderProps {
  title: string
  logo: string
  btns: CardWebHeaderBtn[]
}

const CardWebHeader = () => {
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<CardWebHeaderProps>({
    defaultValues: {
      title: '',
      logo: '',
      btns: [{
        url: 'https://www.baidu.com',
        showIcon: false,
        icon: '',
        variant: 'contained',
        text: '首页',
        target: '_self'
      }, {
        url: 'https://www.baidu.com',
        variant: 'outlined',
        showIcon: true,
        icon: 'https://www.baidu.com/img/PCtm_d9c8750bed0b3c7d089fa7d55720d6cf.png',
        text: '关于',
        target: '_self'
      }]
    }
  })

  const btns = watch('btns')

  const [selectedBtnIndex, setSelectedBtnIndex] = useState<number | null>(null)

  const handleAddButton = () => {
    const newBtn = {
      url: '',
      variant: 'outlined' as const,
      showIcon: false,
      icon: '',
      text: '按钮' + (btns.length + 1),
      target: '_self' as const
    }

    const currentBtns = control._formValues.btns || []
    control._formValues.btns = [...currentBtns, newBtn]
    setSelectedBtnIndex(currentBtns.length)
  }

  const onSubmit = (data: CardWebHeaderProps) => {
    console.log(data)
  }

  return <>
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
    }}>
      <Box sx={{ fontWeight: 'bold' }}>顶部导航</Box>
      <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>
    </Stack>
    <Box sx={{ m: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '32px', mb: 1 }}>网站标题</Box>
      <Controller
        control={control}
        name="title"
        render={({ field }) => <TextField
          fullWidth
          {...field}
          placeholder="输入网站标题"
          error={!!errors.title}
          helperText={errors.title?.message}
        />}
      />
      <Box sx={{ my: 1, fontSize: 14, lineHeight: '32px' }}>
        网站 Logo
      </Box>
      <Controller
        control={control}
        name="logo"
        render={({ field }) => <UploadFile
          {...field}
          type="url"
          accept="image/*"
          width={80}
          onChange={(url) => {
            field.onChange(url)
          }}
        />}
      />
      <Box sx={{ mb: '6px', my: 1, fontSize: 14, lineHeight: '32px' }}>
        导航右侧按钮
      </Box>
      <Stack direction={'row'} gap={1} flexWrap={'wrap'} sx={{ mb: 1 }}>
        {btns.map((btn: CardWebHeaderBtn, index: number) => {
          return <Stack direction={'row'} alignItems={'center'} gap={0.5} key={index}
            sx={{ p: 0.5, border: '1px solid', borderColor: selectedBtnIndex === index ? 'primary.main' : 'divider', borderRadius: '10px' }}>
            <Button
              variant={btn.variant}
              size="small"
              startIcon={btn.showIcon ? <Avatar src={btn.icon} sx={{ width: 24, height: 24 }} /> : undefined}
              onClick={() => {
                if (selectedBtnIndex === index) setSelectedBtnIndex(null)
                else setSelectedBtnIndex(index)
              }}
            >
              {btn.text}
            </Button>
            <IconButton size="small" onClick={() => {
              const newBtns = [...btns]
              newBtns.splice(index, 1)
              setValue('btns', newBtns)
            }} sx={{ color: 'text.auxiliary', ':hover': { color: 'error.main' } }}>
              <Icon type="icon-icon_tool_close" />
            </IconButton>
          </Stack>
        })}
      </Stack>
      {selectedBtnIndex !== null && <Controller
        control={control}
        name="btns"
        render={({ field }) => {
          const btn = field.value[selectedBtnIndex]
          return <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: '10px' }}>
            <Stack gap={1}>
              <Stack direction={'row'}>
                <Box sx={{ fontSize: 14, lineHeight: '32px', width: 80 }}>
                  按钮样式
                </Box>
                <RadioGroup
                  value={btn.variant}
                  onChange={(e) => {
                    const newBtns = [...field.value]
                    newBtns[selectedBtnIndex] = { ...btn, variant: e.target.value as 'contained' | 'outlined' }
                    field.onChange(newBtns)
                  }}
                  row
                >
                  <FormControlLabel value="contained" control={<Radio size="small" />} label="实心按钮" />
                  <FormControlLabel value="outlined" control={<Radio size="small" />} label="描边按钮" />
                </RadioGroup>
              </Stack>
              <Stack direction={'row'} alignItems={'center'}>
                <Box sx={{ fontSize: 14, lineHeight: '32px', flexShrink: 0, width: 80 }}>
                  按钮文本
                </Box>
                <TextField
                  fullWidth
                  value={btn.text}
                  onChange={(e) => {
                    const newBtns = [...field.value]
                    newBtns[selectedBtnIndex] = { ...btn, text: e.target.value }
                    field.onChange(newBtns)
                  }}
                />
              </Stack>
              <Stack direction={'row'} alignItems={'center'}>
                <Box sx={{ fontSize: 14, lineHeight: '32px', flexShrink: 0, width: 80 }}>
                  链接地址
                </Box>
                <TextField
                  fullWidth
                  value={btn.url}
                  onChange={(e) => {
                    const newBtns = [...field.value]
                    newBtns[selectedBtnIndex] = { ...btn, url: e.target.value }
                    field.onChange(newBtns)
                  }}
                />
              </Stack>
              <Stack direction={'row'}>
                <Box sx={{ fontSize: 14, lineHeight: '32px', width: 80 }}>
                  图标
                </Box>
                <FormControl>
                  <Stack direction={'row'} alignItems={'flex-start'} gap={2}>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <Checkbox
                        size="small"
                        sx={{ p: 0, m: 0 }}
                        checked={btn.showIcon}
                        onChange={(e) => {
                          const newBtns = [...field.value]
                          newBtns[selectedBtnIndex] = { ...btn, showIcon: e.target.checked }
                          field.onChange(newBtns)
                        }}
                      />
                      <Box sx={{ fontSize: 14, lineHeight: '32px' }}>展示图标</Box>
                    </Stack>
                    <UploadFile
                      name="icon"
                      type="url"
                      accept="image/*"
                      width={60}
                      value={btn.icon}
                      onChange={(url) => {
                        const newBtns = [...field.value]
                        newBtns[selectedBtnIndex] = { ...btn, icon: url }
                        field.onChange(newBtns)
                      }}
                    />
                  </Stack>
                </FormControl>
              </Stack>
              <Stack direction={'row'}>
                <Box sx={{ fontSize: 14, lineHeight: '32px', width: 80 }}>
                  打开方式
                </Box>
                <RadioGroup
                  value={btn.target}
                  onChange={(e) => {
                    const newBtns = [...field.value]
                    newBtns[selectedBtnIndex] = { ...btn, target: e.target.value as '_blank' | '_self' }
                    field.onChange(newBtns)
                  }}
                  row
                >
                  <FormControlLabel value="_self" control={<Radio size="small" />} label="当前窗口" />
                  <FormControlLabel value="_blank" control={<Radio size="small" />} label="新窗口" />
                </RadioGroup>
              </Stack>
            </Stack>
          </Box>
        }}
      />}
      <Button
        variant="outlined"
        size="small"
        onClick={handleAddButton}
        sx={{ mt: 1 }}
        startIcon={<Icon type="icon-add" />}
      >
        添加按钮
      </Button>
    </Box>
  </>
}
export default CardWebHeader