import { DocListItem, getAppDetail, getDocList, updateAppDetail } from "@/api"
import { FreeSoloAutocomplete } from "@/components/FreeSoloAutocomplete"
import UploadFile from "@/components/UploadFile"
import { useCommitPendingInput } from "@/hooks"
import { useAppSelector } from "@/store"
import { addOpacityToColor } from "@/utils"
import { Autocomplete, Box, Chip, Stack, TextField, useTheme } from "@mui/material"
import { Ellipsis, Icon, Message, Modal } from "ct-mui"
import { useCallback, useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

interface ConfigWebProps {
  id: string
  open: boolean
  onClose: () => void
  refresh: () => void
}

type FormData = {
  icon: string
  name: string
  welcome_str: string
  recommend_questions: string[]
  recommend_doc_ids: string[]
  search_placeholder: string
}

const ConfigWeb = ({ id, open, onClose, refresh }: ConfigWebProps) => {
  const theme = useTheme()
  const { kb_id } = useAppSelector(state => state.config)
  const [docList, setDocList] = useState<DocListItem[]>([])
  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      icon: '',
      name: '',
      welcome_str: '',
      recommend_questions: [],
      recommend_doc_ids: [],
      search_placeholder: '',
    }
  })

  const recommend_questions = watch('recommend_questions') || []
  const recommend_doc_ids = watch('recommend_doc_ids') || []

  const recommendQuestionsField = useCommitPendingInput<string>({
    value: recommend_questions,
    setValue: (value) => {
      setValue('recommend_questions', value)
    }
  })

  const onSubmit = (data: FormData) => {
    updateAppDetail({ id }, {
      name: data.name,
      settings: {
        icon: data.icon,
        welcome_str: data.welcome_str,
        recommend_questions: data.recommend_questions,
        recommend_doc_ids: data.recommend_doc_ids,
        search_placeholder: data.search_placeholder,
      }
    }).then(() => {
      Message.success('保存成功')
      onClose()
      reset()
      refresh()
    })
  }

  const getDocOptions = useCallback(() => {
    getDocList({ kb_id }).then(res => {
      setDocList(res.filter(item => item.status === 2))
    })
  }, [kb_id])

  const getAppData = useCallback(() => {
    getAppDetail({ id }).then(res => {
      reset({
        icon: res.settings.icon,
        name: res.name,
        welcome_str: res.settings.welcome_str,
        recommend_questions: res.settings.recommend_questions,
        recommend_doc_ids: res.settings.recommend_doc_ids,
        search_placeholder: res.settings.search_placeholder,
      })
    })
  }, [id, reset])

  useEffect(() => {
    if (open && kb_id) {
      getAppData()
      getDocOptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id, kb_id])

  return <Modal
    open={open}
    onCancel={() => {
      onClose()
      reset()
    }}
    title="前台网站配置"
    onOk={handleSubmit(onSubmit)}
  >
    <Box sx={{ fontSize: 14, lineHeight: '36px' }}>
      网站名称
      <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
    </Box>
    <Controller
      control={control}
      name='name'
      rules={{
        required: '网站名称',
      }}
      render={({ field }) => <TextField
        {...field}
        fullWidth
        size="small"
        placeholder="请输入网站名称"
        error={!!errors.name}
        helperText={errors.name?.message}
      />}
    />
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
      欢迎标语
      <Box component={'span'} sx={{ color: 'red', ml: 0.5 }}>*</Box>
    </Box>
    <Controller
      control={control}
      name="welcome_str"
      rules={{
        required: '欢迎标语',
      }}
      render={({ field }) => <TextField
        {...field}
        fullWidth
        size="small"
        placeholder="请输入欢迎标语"
        error={!!errors.welcome_str}
        helperText={errors.welcome_str?.message}
      />}
    />
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>
      网站 Logo
    </Box>
    <Controller
      control={control}
      name="icon"
      render={({ field }) => <UploadFile
        {...field}
        type="base64"
        accept="image/*"
        width={80}
      />}
    />
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>搜索框提示语</Box>
    <Controller
      control={control}
      name="search_placeholder"
      render={({ field }) => <TextField
        {...field}
        fullWidth
        size="small"
        placeholder="请输入搜索框提示语"
        error={!!errors.search_placeholder}
        helperText={errors.search_placeholder?.message}
      />}
    />
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>推荐问题</Box>
    <FreeSoloAutocomplete
      placeholder=''
      {...recommendQuestionsField}
    />
    <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>推荐内容</Box>
    <Controller
      control={control}
      name="recommend_doc_ids"
      render={({ field }) => <Autocomplete
        {...field}
        multiple
        options={docList}
        getOptionLabel={(option) => (option.title || option.url)}
        disableCloseOnSelect
        slotProps={{
          paper: {
            sx: {
              borderRadius: '10px',
            }
          },
          listbox: {
            sx: {
              p: '4px',
              '.MuiAutocomplete-option': {
                borderRadius: '5px',
                fontSize: '12px',
                '&[aria-selected="true"]': {
                  color: 'primary.main',
                  backgroundColor: addOpacityToColor(theme.palette.primary.main, 0.1) + ' !important',
                }
              }
            }
          },
        }}
        renderOption={(props, option) => (
          <Box component="li" {...props} sx={{ fontSize: 12 }}>
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <Icon type='icon-bangzhuwendang1' sx={{ fontSize: 14, color: '#2f80f7' }} />
              <Ellipsis sx={{ width: '400px' }}>{option.title || option.url}</Ellipsis>
            </Stack>
          </Box>
        )}
        clearIcon={<Icon type='icon-icon_tool_close' sx={{ fontSize: 18, flexShrink: 0, color: 'text.auxiliary' }} />}
        getOptionKey={(option) => option.id}
        value={docList.filter(item => recommend_doc_ids.includes(item.id)) || []}
        onChange={(_, newValue) => {
          setValue('recommend_doc_ids', newValue.map(item => item.id))
        }}
        renderTags={(value, getTagProps) => {
          return value.map((option, index: number) => {
            return (
              <Chip
                variant='outlined'
                size='small'
                label={<Ellipsis sx={{ fontSize: 12, maxWidth: 140 }}>{option.title || option.url}</Ellipsis>}
                {...getTagProps({ index })}
                key={index}
                icon={<Icon type='icon-bangzhuwendang1' sx={{
                  fontSize: '14px !important',
                  color: '#2f80f7 !important',
                  mr: '4px !important',
                }} />}
              />
            )
          })
        }}
        renderInput={(params) => <TextField {...params} size="small" />}
        filterOptions={(options, { inputValue }) => {
          const filterValue = inputValue.toLowerCase();
          return options.filter(option =>
            option.title.toLowerCase().includes(filterValue) ||
            (option.url && option.url.toLowerCase().includes(filterValue))
          );
        }}
        popupIcon={<Icon type='icon-xiala' sx={{ fontSize: 24, color: 'text.primary' }} />}
      />}
    />
  </Modal>
}

export default ConfigWeb