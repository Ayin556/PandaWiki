import React, { useEffect } from 'react';
import { CommonItem, StyledCommonWrapper } from '../../components/StyledCommon';
import { TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import DragList from './DragList';
import type { ConfigProps } from '../type';
import { useAppSelector } from '@/store';
import useDebounceAppPreviewData from '@/hooks/useDebounceAppPreviewData';
import { DEFAULT_DATA } from '../../../constants';
import { Empty } from '@ctzhian/ui';
import ColorPickerField from '../../components/ColorPickerField';

type FormValues = {
  title: string;
  list: {
    id: string;
    title: string;
    url: string;
    desc: string;
  }[];
  bg_color: string;
  title_color: string;
};

const Config = ({ setIsEdit }: ConfigProps) => {
  const { appPreviewData } = useAppSelector(state => state.config);
  const debouncedDispatch = useDebounceAppPreviewData();
  const { control, setValue, watch, subscribe } = useForm<FormValues>({
    defaultValues:
      appPreviewData?.settings?.web_app_landing_settings?.carousel_config ||
      DEFAULT_DATA.carousel,
  });

  const list = watch('list') || [];

  const handleAddQuestion = () => {
    const nextId = `${Date.now()}`;
    setValue('list', [...list, { id: nextId, title: '', url: '', desc: '' }]);
  };

  const handleListChange = (newList: FormValues['list']) => {
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
              carousel_config: values,
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
      <CommonItem
        title='图片'
        desc='(推荐 880*495，16:9 )'
        onAdd={handleAddQuestion}
      >
        {list.length === 0 ? (
          <Empty />
        ) : (
          <DragList
            data={list}
            onChange={handleListChange}
            setIsEdit={setIsEdit}
          />
        )}
      </CommonItem>
    </StyledCommonWrapper>
  );
};

export default Config;
