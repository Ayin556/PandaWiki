import { DomainKnowledgeBaseDetail } from '@/request/types';
import Card from '@/components/Card';
import { getApiProV1Prompt, postApiProV1Prompt } from '@/request/pro/Prompt';
import { Box, Button, Slider, Stack, TextField, Tooltip } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import InfoIcon from '@mui/icons-material/Info';
import { useAppSelector } from '@/store';
import { Message } from 'ct-mui';

interface CardAIProps {
  kb: DomainKnowledgeBaseDetail;
}

const CardAI = ({ kb }: CardAIProps) => {
  const [isEdit, setIsEdit] = useState(false);
  const { license } = useAppSelector(state => state.config);

  const { control, handleSubmit, setValue } = useForm({
    defaultValues: {
      block_words: '',
      interval: 0,
      content: '',
    },
  });

  const onSubmit = handleSubmit(data => {
    console.log(data);
    postApiProV1Prompt({
      kb_id: kb.id!,
      content: data.content,
    }).then(() => {
      Message.success('保存成功');
      setIsEdit(false);
    });
  });

  const isPro = useMemo(() => {
    return license.edition === 1 || license.edition === 2;
  }, [license]);

  useEffect(() => {
    if (!kb.id || !isPro) return;
    getApiProV1Prompt({ kb_id: kb.id! }).then(res => {
      setValue('content', res.content || '');
    });
  }, [kb, isPro]);

  return (
    <Card>
      <Box
        sx={{
          fontWeight: 'bold',
          px: 2,
          py: 1.5,
          bgcolor: 'background.paper2',
        }}
      >
        AI 设置
      </Box>
      <Stack
        direction='row'
        alignItems={'center'}
        justifyContent={'space-between'}
        sx={{
          m: 2,
          height: 32,
          fontWeight: 'bold',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            '&::before': {
              content: '""',
              display: 'inline-block',
              width: 4,
              height: 12,
              bgcolor: 'common.black',
              borderRadius: '2px',
              mr: 1,
            },
          }}
        >
          智能问答
          {!isPro && (
            <Tooltip title='联创版和企业版可用' placement='top' arrow>
              <InfoIcon sx={{ color: 'text.secondary', fontSize: 14, ml: 1 }} />
            </Tooltip>
          )}
        </Box>
        {isEdit && (
          <Button variant='contained' size='small' onClick={onSubmit}>
            保存
          </Button>
        )}
      </Stack>
      <Box sx={{ m: 2 }}>
        <Stack
          direction='row'
          alignItems={'center'}
          justifyContent={'space-between'}
          sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}
        >
          <Box sx={{ fontSize: 14, lineHeight: '32px' }}>智能问答提示词</Box>
          {/* <Button
            size='small'
            component='a'
            href='https://pandawiki.docs.baizhi.cloud/node/01971b5f-4520-7c4b-8b4e-683ec5235adc'
            target='_blank'
          >
            使用方法
          </Button> */}
        </Stack>
        <Controller
          control={control}
          name='content'
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              disabled={!isPro}
              multiline
              rows={4}
              placeholder='智能问答提示词'
              onChange={e => {
                field.onChange(e.target.value);
                setIsEdit(true);
              }}
            />
          )}
        />

        <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
          屏蔽问题中的关键字（敬请期待）
        </Box>
        <Controller
          control={control}
          name='block_words'
          render={({ field }) => (
            <TextField
              {...field}
              fullWidth
              disabled
              placeholder='屏蔽问题中的关键字'
              onChange={e => {
                field.onChange(e.target.value);
                setIsEdit(true);
              }}
            />
          )}
        />
        <Box sx={{ fontSize: 14, lineHeight: '32px', my: 1 }}>
          连续提问时间间隔（敬请期待）
        </Box>
        <Controller
          control={control}
          name='interval'
          render={({ field }) => (
            <Slider
              {...field}
              disabled
              valueLabelDisplay='auto'
              min={200}
              max={300}
              step={5}
              sx={{
                width: 432,
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  border: '2px solid currentColor',
                  '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                    boxShadow: 'inherit',
                  },
                  '&::before': {
                    display: 'none',
                  },
                },
                '& .MuiSlider-track': {
                  bgcolor: 'primary.main',
                },
                '& .MuiSlider-rail': {
                  bgcolor: 'text.disabled',
                },
                '& .MuiSlider-valueLabel': {
                  lineHeight: 1.2,
                  fontSize: 12,
                  fontWeight: 'bold',
                  background: 'unset',
                  p: 0,
                  width: 24,
                  height: 24,
                  borderRadius: '50% 50% 50% 0',
                  bgcolor: 'primary.main',
                  transformOrigin: 'bottom left',
                  transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
                  '&::before': { display: 'none' },
                  '&.MuiSlider-valueLabelOpen': {
                    transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
                  },
                  '& > *': {
                    transform: 'rotate(45deg)',
                  },
                },
              }}
              onChange={(e, value) => {
                field.onChange(+value);
                setIsEdit(true);
              }}
            />
          )}
        />
      </Box>
    </Card>
  );
};

export default CardAI;
