import { Box, Button, Checkbox, Stack, TextField } from "@mui/material"
import { Controller, useForm } from "react-hook-form"

interface CardWebSEOProps {
  description: string
  keywords: string
  autoSitemap: boolean
}

const CardWebSEO = () => {
  const { handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      description: '',
      keywords: '',
      autoSitemap: false,
    }
  })

  const onSubmit = (data: CardWebSEOProps) => {
    console.log(data)
  }

  return <>
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
    }}>
      <Box sx={{ fontWeight: 'bold' }}>SEO</Box>
      <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>
    </Stack>
    <Box sx={{ m: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '32px', mb: 1 }}>网站描述</Box>
      <Controller
        control={control}
        name="description"
        render={({ field }) => <TextField
          fullWidth
          {...field}
          placeholder="输入网站描述"
          error={!!errors.description}
          helperText={errors.description?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>关键词</Box>
      <Controller
        control={control}
        name="keywords"
        render={({ field }) => <TextField
          fullWidth
          {...field}
          placeholder="输入关键词"
          error={!!errors.keywords}
          helperText={errors.keywords?.message}
        />}
      />
      <Controller
        control={control}
        name="autoSitemap"
        render={({ field }) => <Stack direction='row' alignItems={'center'} gap={2} sx={{ mt: 1 }}>
          <Checkbox {...field} size="small" sx={{ p: 0, m: 0 }} />
          <Box sx={{ fontSize: 14, lineHeight: '32px' }}>自动生成sitemap</Box>
        </Stack>}
      />
    </Box>
  </>
}
export default CardWebSEO