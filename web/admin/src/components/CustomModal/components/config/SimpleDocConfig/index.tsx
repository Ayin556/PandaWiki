import React, { useEffect, useState } from 'react';
import { CommonItem, StyledCommonWrapper } from '../../components/StyledCommon';
import { TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import DragList from './DragList';
import { Empty } from '@ctzhian/ui';
import type { ConfigProps } from '../type';
import { useAppSelector } from '@/store';
import useDebounceAppPreviewData from '@/hooks/useDebounceAppPreviewData';
import AddRecommendContent from '@/pages/setting/component/AddRecommendContent';
import { getApiV1NodeRecommendNodes } from '@/request/Node';
import { DomainRecommendNodeListResp } from '@/request/types';
import { DEFAULT_DATA } from '../../../constants';
import ColorPickerField from '../../components/ColorPickerField';

type FormValues = {
  title: string;
  docs: DomainRecommendNodeListResp[];
  bg_color: string;
  title_color: string;
};

const SimpleDocConfigConfig = ({ setIsEdit }: ConfigProps) => {
  const { kb_id } = useAppSelector(state => state.config);
  const { appPreviewData } = useAppSelector(state => state.config);
  const debouncedDispatch = useDebounceAppPreviewData();
  const { control, setValue, watch, subscribe } = useForm<FormValues>({
    defaultValues:
      appPreviewData?.settings?.web_app_landing_settings?.simple_doc_config ||
      DEFAULT_DATA.simpleDoc,
  });

  const docs = watch('docs') || [];
  const [open, setOpen] = useState(false);

  const nodeRec = (ids: string[]) => {
    getApiV1NodeRecommendNodes({ kb_id, node_ids: ids }).then(res => {
      setValue('docs', res);
    });
  };

  const handleListChange = (newList: string[]) => {
    nodeRec(newList);
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
              simple_doc_config: {
                ...values,
              },
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
      <CommonItem title='推荐文档' onAdd={() => setOpen(true)}>
        {docs.length === 0 ? (
          <Empty />
        ) : (
          <DragList
            data={docs}
            onChange={value => {
              setIsEdit(true);
              setValue('docs', value);
            }}
            setIsEdit={setIsEdit}
          />
        )}
      </CommonItem>
      <AddRecommendContent
        open={open}
        selected={docs.map(item => item.id!)}
        onChange={handleListChange}
        onClose={() => setOpen(false)}
        disabled={item => item.type === 1}
      />
    </StyledCommonWrapper>
  );
};

export default SimpleDocConfigConfig;
