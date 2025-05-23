import { Box, Button, Stack, TextField } from "@mui/material"
import { Controller, useForm } from "react-hook-form"

interface CardWebCustomCodeProps {
  head_code: string
  body_code: string
}

const CardWebCustomCode = () => {
  const { handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      head_code: '',
      body_code: '',
    }
  })
  const onSubmit = (data: CardWebCustomCodeProps) => {
    console.log(data)
  }
  return <>
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
    }}>
      <Box sx={{ fontWeight: 'bold' }}>自定义代码</Box>
      <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>
    </Stack>
    <Box sx={{ m: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '32px', mb: 1 }}>注入到 Head 标签</Box>
      <Controller
        control={control}
        name="head_code"
        render={({ field }) => <TextField
          fullWidth
          multiline
          rows={4}
          {...field}
          placeholder="输入Head 代码"
          error={!!errors.head_code}
          helperText={errors.head_code?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>注入到 Body 标签</Box>
      <Controller
        control={control}
        name="body_code"
        render={({ field }) => <TextField
          fullWidth
          {...field}
          multiline
          rows={4}
          placeholder="输入Body 代码"
          error={!!errors.body_code}
          helperText={errors.body_code?.message}
        />}
      />
    </Box>
  </>
}
export default CardWebCustomCode