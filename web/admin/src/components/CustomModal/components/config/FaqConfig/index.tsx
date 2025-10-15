import React, { useEffect } from 'react';
import { CommonItem, StyledCommonWrapper } from '../../components/StyledCommon';
import { TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import FaqDragList from './FaqDragList';
import type { ConfigProps } from '../type';
import { useAppSelector } from '@/store';
import useDebounceAppPreviewData from '@/hooks/useDebounceAppPreviewData';
import { Empty } from '@ctzhian/ui';
import { DEFAULT_DATA } from '../../../constants';
import ColorPickerField from '../../components/ColorPickerField';

type FaqFormValues = {
  title: string;
  list: {
    id: string;
    question: string;
    link: string;
  }[];
  bg_color: string;
  title_color: string;
};

const FaqConfig = ({ setIsEdit }: ConfigProps) => {
  const { appPreviewData } = useAppSelector(state => state.config);
  const debouncedDispatch = useDebounceAppPreviewData();
  const { control, setValue, watch, subscribe } = useForm<FaqFormValues>({
    defaultValues:
      appPreviewData?.settings?.web_app_landing_settings?.faq_config ||
      DEFAULT_DATA.faq,
  });

  const list = watch('list') || [];

  const handleAddQuestion = () => {
    const nextId = `${Date.now()}`;
    setValue('list', [...list, { id: nextId, question: '', link: '' }]);
  };

  const handleListChange = (newList: FaqFormValues['list']) => {
    setValue('list', newList);
    setIsEdit(true);
  };

  useEffect(() => {
    const callback = subscribe({
      formState: {
        values: true,
      },
      callback: ({ values }) => {
        const previewData = {
          ...appPreviewData,
          settings: {
            ...appPreviewData?.settings,
            web_app_landing_settings: {
              ...appPreviewData?.settings?.web_app_landing_settings,
              faq_config: values,
            },
          },
        };
        setIsEdit(true);
        debouncedDispatch(previewData);
      },
    });
    return () => {
      callback();
    };
  }, [subscribe]);

  return (
    <StyledCommonWrapper>
      <CommonItem title='标题'>
        <Controller
          control={control}
          name='title'
          render={({ field }) => (
            <TextField label='文字' {...field} placeholder='请输入' />
          )}
        />
        <Controller
          control={control}
          name='title_color'
          render={({ field }) => (
            <ColorPickerField
              label='标题颜色'
              value={field.value}
              onChange={field.onChange}
              sx={{ flex: 1 }}
            />
          )}
        />
      </CommonItem>
      <CommonItem title='背景颜色'>
        <Controller
          control={control}
          name='bg_color'
          render={({ field }) => (
            <ColorPickerField
              value={field.value}
              onChange={field.onChange}
              sx={{ flex: 1 }}
            />
          )}
        />
      </CommonItem>
      <CommonItem title='问题列表' onAdd={handleAddQuestion}>
        {list.length === 0 ? (
          <Empty />
        ) : (
          <FaqDragList
            data={list}
            onChange={handleListChange}
            setIsEdit={setIsEdit}
          />
        )}
      </CommonItem>
    </StyledCommonWrapper>
  );
};

export default FaqConfig;
