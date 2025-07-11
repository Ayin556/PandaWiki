import { KnowledgeBaseListItem } from "@/api"
import ShowText from "@/components/ShowText"
import { Box, Button, FormControl, FormControlLabel, Radio, RadioGroup, Stack, TextField } from "@mui/material"
import { set } from "lodash"
import { useEffect, useState } from "react"

const CardRobotApi = ({ kb }: { kb: KnowledgeBaseListItem }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
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
      }}>问答机器人 API（敬请期待） </Box>
      {isEdit && <Button variant="contained" size="small" disabled={true}>保存</Button>}
    </Stack>
    <Stack gap={2} sx={{ mx: 2}}>
      <Stack direction={'row'} gap={2} alignItems={'center'}>
        <Box sx={{ width: 156, fontSize: 14, lineHeight: '32px' }}>
          问答机器人 API
        </Box>
        <FormControl>
          <RadioGroup
            value={isEnabled}
            onChange={(e) => {
              setIsEnabled(e.target.value === 'true')
              setIsEdit(e.target.value === 'true')
            }}
          >
            <Stack direction={'row'}>
              <FormControlLabel value={true} control={<Radio size='small' />} label="启用" />
              <FormControlLabel value={false} control={<Radio size='small' />} label="禁用" />
            </Stack>
          </RadioGroup>
        </FormControl>
      </Stack>
      {isEnabled && <> 
        <Stack direction={'row'} gap={2} alignItems={'center'}  sx={{ fontSize: 14, lineHeight: '32px'}}>
          <Box component={'label'}  sx={{ width: 156, flexShrink: 0, fontSize: 14, lineHeight: '32px' }}>
            API Token
          </Box>
          
          <TextField
            fullWidth
            label='API Token'
            placeholder={"API Token"}
          />
        </Stack>
        <Stack direction={'row'} gap={2} alignItems={'center'}  sx={{ fontSize: 14, lineHeight: '32px'}}>
          <Box component={'label'}  sx={{ width: 156, flexShrink: 0, fontSize: 14, lineHeight: '32px' }}>
            API 调用地址
          </Box>
          <TextField
            fullWidth
            label='API 调用地址'
            placeholder={"API 调用地址"}
          />
        </Stack>
      </>}
    </Stack>
  </>
}

export default CardRobotApi