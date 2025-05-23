import { getNodeList, NodeListItem } from "@/api"
import { FreeSoloAutocomplete } from "@/components/FreeSoloAutocomplete"
import { useCommitPendingInput } from "@/hooks"
import { useAppSelector } from "@/store"
import { addOpacityToColor } from "@/utils"
import { Autocomplete, Box, Button, Chip, Stack, TextField, useTheme } from "@mui/material"
import { Ellipsis, Icon } from "ct-mui"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"

interface CardWebWelcomeProps {
  welcome: string
  search_placeholder: string
  recommend_questions: string[]
  recommend_doc_ids: string[]
}

const CardWebWelcome = () => {
  const theme = useTheme()
  const { kb_id } = useAppSelector(state => state.config)
  const [nodeList, setNodeList] = useState<NodeListItem[]>([])
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<CardWebWelcomeProps>({
    defaultValues: {
      welcome: '',
      search_placeholder: '',
      recommend_questions: [],
      recommend_doc_ids: [],
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

  const onSubmit = (data: CardWebWelcomeProps) => {
    console.log(data)
  }

  useEffect(() => {
    getNodeList({ kb_id: kb_id }).then((res) => {
      setNodeList(res)
    })
  }, [])

  return <>
    <Stack direction='row' alignItems={'center'} justifyContent={'space-between'} sx={{
      m: 2,
      height: 32,
    }}>
      <Box sx={{ fontWeight: 'bold' }}>欢迎页面</Box>
      <Button variant="contained" size="small" onClick={handleSubmit(onSubmit)}>保存</Button>
    </Stack>
    <Box sx={{ m: 2 }}>
      <Box sx={{ fontSize: 14, lineHeight: '32px', mb: 1 }}>欢迎标语</Box>
      <Controller
        control={control}
        name="welcome"
        render={({ field }) => <TextField
          fullWidth
          {...field}
          placeholder="输入欢迎标语"
          error={!!errors.welcome}
          helperText={errors.welcome?.message}
        />}
      />
      <Box sx={{ fontSize: 14, lineHeight: '32px', mb: 1 }}>搜索框提示文字</Box>
      <Controller
        control={control}
        name="search_placeholder"
        render={({ field }) => <TextField
          fullWidth
          {...field}
          placeholder="输入搜索框提示文字"
          error={!!errors.search_placeholder}
          helperText={errors.search_placeholder?.message}
        />}
      />
      <Box sx={{ my: 1, fontSize: 14, lineHeight: '32px' }}>推荐问题</Box>
      <FreeSoloAutocomplete
        placeholder='回车确认，填写下一个推荐问题'
        {...recommendQuestionsField}
      />
      <Box sx={{ mb: '6px', mt: 2, fontSize: 14, lineHeight: '32px' }}>推荐内容</Box>
      <Controller
        control={control}
        name="recommend_doc_ids"
        render={({ field }) => <Autocomplete
          {...field}
          multiple
          options={nodeList}
          getOptionLabel={(option) => option.name}
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
                <Icon type={option.type === 1 ? 'icon-wenjianjia' : 'icon-wenjian'} sx={{ fontSize: 14, color: '#2f80f7' }} />
                <Ellipsis sx={{ width: '400px' }}>{option.name}</Ellipsis>
              </Stack>
            </Box>
          )}
          clearIcon={<Icon type='icon-icon_tool_close' sx={{ fontSize: 18, flexShrink: 0, color: 'text.auxiliary' }} />}
          getOptionKey={(option) => option.id}
          value={nodeList.filter(item => recommend_doc_ids.includes(item.id)) || []}
          onChange={(_, newValue) => {
            setValue('recommend_doc_ids', newValue.map(item => item.id))
          }}
          renderTags={(value, getTagProps) => {
            return value.map((option, index: number) => {
              return (
                <Chip
                  variant='outlined'
                  size='small'
                  label={<Ellipsis sx={{ fontSize: 12, maxWidth: 140 }}>{option.name}</Ellipsis>}
                  {...getTagProps({ index })}
                  key={index}
                  icon={<Icon type={option.type === 1 ? 'icon-wenjianjia' : 'icon-wenjian'} sx={{
                    fontSize: '14px !important',
                    mx: '4px !important',
                  }} />}
                />
              )
            })
          }}
          renderInput={(params) => <TextField {...params} placeholder="选择推荐内容" />}
          filterOptions={(options, { inputValue }) => {
            const filterValue = inputValue.toLowerCase();
            return options.filter(option =>
              option.name.toLowerCase().includes(filterValue)
            );
          }}
          popupIcon={<Icon type='icon-xiala' sx={{ fontSize: 24, color: 'text.primary' }} />}
        />}
      />
    </Box>
  </>
}
export default CardWebWelcome