import {
  Box,
  Button,
  Stack,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { message } from '@ctzhian/ui';
import { useEffect, useState } from 'react';
import CustomModal from '@/components/CustomModal';
import { SettingCardItem, FormItem } from './Common';
import { useForm, Controller } from 'react-hook-form';
import {
  DomainAppDetailResp,
  DomainKnowledgeBaseDetail,
  ConstsHomePageSetting,
} from '@/request/types';
import { useAppSelector } from '@/store';
import { putApiV1App } from '@/request/App';

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
      more={
        <Button
          size='small'
          color='primary'
          variant='outlined'
          sx={{ ml: 2 }}
          onClick={() => {
            setCustomModalOpen(true);
          }}
        >
          定制页面
        </Button>
      }
    >
      <FormItem label='默认首页'>
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
              <FormControlLabel
                value='doc'
                control={<Radio size='small' />}
                label={<Box sx={{ width: 65 }}>文档页面</Box>}
              />
              <FormControlLabel
                value='custom'
                control={<Radio size='small' />}
                label={<Box sx={{ width: 85 }}>自定义欢迎页</Box>}
              />
            </RadioGroup>
          )}
        />
      </FormItem>
      <CustomModal
        open={customModalOpen}
        onCancel={() => setCustomModalOpen(false)}
      />
    </SettingCardItem>
  );
};

export default CardCustom;
