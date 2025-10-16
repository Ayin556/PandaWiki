import documentPng from '@/assets/images/document.png';
import welcomePng from '@/assets/images/welcome.png';
import CustomModal from '@/components/CustomModal';
import { putApiV1App } from '@/request/App';
import {
  ConstsHomePageSetting,
  DomainAppDetailResp,
  DomainKnowledgeBaseDetail,
} from '@/request/types';
import { useAppSelector } from '@/store';
import { message } from '@ctzhian/ui';
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FormItem, SettingCardItem } from './Common';

interface CardCustomProps {
  kb: DomainKnowledgeBaseDetail;
  refresh: (value: { home_page_setting: ConstsHomePageSetting }) => void;
  info: DomainAppDetailResp;
}

const CardCustom = ({ kb, refresh, info }: CardCustomProps) => {
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const { kb_id } = useAppSelector(state => state.config);
  const {
    control,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      home_page_setting: ConstsHomePageSetting.HomePageSettingDoc,
    },
  });
  const [isEdit, setIsEdit] = useState(false);

  const onSubmit = handleSubmit(value => {
    putApiV1App(
      { id: info.id! },
      {
        kb_id,
        settings: {
          ...info.settings,
          home_page_setting: value.home_page_setting,
        },
      },
    ).then(() => {
      refresh(value);
      message.success('保存成功');
      setIsEdit(false);
    });
  });

  useEffect(() => {
    setValue(
      'home_page_setting',
      info?.settings?.home_page_setting ||
        ConstsHomePageSetting.HomePageSettingDoc,
    );
  }, [info]);

  return (
    <SettingCardItem
      title='前台网站样式个性化'
      isEdit={isEdit}
      onSubmit={onSubmit}
    >
      <FormItem label='默认首页' sx={{ alignItems: 'flex-start' }}>
        <Controller
          control={control}
          name='home_page_setting'
          render={({ field }) => (
            <RadioGroup
              row
              {...field}
              value={field.value}
              onChange={e => {
                field.onChange(e.target.value);
                setIsEdit(true);
              }}
            >
              <Stack sx={{ width: 200, mr: 2 }}>
                <img src={documentPng} width={200} height={115.28} alt='全屏' />
                <FormControlLabel
                  value='doc'
                  control={<Radio size='small' />}
                  label={<Box sx={{ width: 65 }}>文档页面</Box>}
                />
              </Stack>
              <Stack sx={{ mr: 2 }}>
                <img
                  src={welcomePng}
                  width={200}
                  height={115.28}
                  alt='欢迎页面'
                />
                <FormControlLabel
                  value='custom'
                  control={<Radio size='small' />}
                  label={
                    <Stack direction={'row'} alignItems={'center'}>
                      <Box>欢迎页面</Box>
                    </Stack>
                  }
                />
              </Stack>
            </RadioGroup>
          )}
        />
      </FormItem>
      <FormItem label='自定义欢迎页面'>
        <Button
          variant='outlined'
          fullWidth
          onClick={() => setCustomModalOpen(true)}
        >
          定制页面
        </Button>
      </FormItem>
      <CustomModal
        open={customModalOpen}
        onCancel={() => setCustomModalOpen(false)}
      />
    </SettingCardItem>
  );
};

export default CardCustom;
