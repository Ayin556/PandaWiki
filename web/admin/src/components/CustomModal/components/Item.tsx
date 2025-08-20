import { CardWebHeaderBtn } from '@/api';
import Avatar from '@/components/Avatar';
import UploadFile from '@/components/UploadFile';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAppPreviewData } from '@/store/slices/config';
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { Icon } from 'ct-mui';
import {
  CSSProperties,
  Dispatch,
  forwardRef,
  HTMLAttributes,
  SetStateAction,
  useEffect,
} from 'react';
import { Controller, useForm } from 'react-hook-form';

export type ItemProps = HTMLAttributes<HTMLDivElement> & {
  item: CardWebHeaderBtn;
  withOpacity?: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
  handleRemove?: (id: string) => void;
  setIsEdit: Dispatch<SetStateAction<boolean>>;
  data: CardWebHeaderBtn[];
};

const Item = forwardRef<HTMLDivElement, ItemProps>(
  (
    {
      item,
      withOpacity,
      isDragging,
      style,
      dragHandleProps,
      handleRemove,
      setIsEdit,
      data,
      ...props
    },
    ref,
  ) => {
    const dispatch = useAppDispatch();
    const { appPreviewData } = useAppSelector(state => state.config);
    const inlineStyles: CSSProperties = {
      opacity: withOpacity ? '0.5' : '1',
      borderRadius: '10px',
      cursor: isDragging ? 'grabbing' : 'grab',
      backgroundColor: '#ffffff',
      ...style,
    };
    const { control, setValue, watch } = useForm<{ btns: CardWebHeaderBtn[] }>({
      defaultValues: {
        btns: [],
      },
    });
    const btns = watch('btns');
    useEffect(() => {
      if (data) {
        setValue('btns', data);
      }
    }, [data]);
    useEffect(() => {
      if (!appPreviewData) return;
      const previewData = {
        ...appPreviewData,
        settings: {
          ...appPreviewData.settings,
          btns: btns,
        },
      };
      dispatch(setAppPreviewData(previewData));
    }, [btns]);
    return (
      <Box ref={ref} style={inlineStyles} {...props}>
        <Stack
          direction={'row'}
          alignItems={'center'}
          justifyContent={'space-between'}
          gap={0.5}
          sx={{
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '10px',
            height: '184px',
            width: '276px',
          }}
        >
          <Controller
            control={control}
            name='btns'
            render={({ field }) => {
              const curBtn = btns.find(btn => btn.id === item.id);
              if (!curBtn) return <></>;
              return (
                <Stack direction={'column'} gap={1}>
                  <Stack direction={'row'} gap={1}>
                    <Select
                      value={curBtn.variant}
                      onChange={e => {
                        const newBtns = [
                          ...(appPreviewData?.settings.btns || []),
                        ];
                        const index = newBtns.findIndex(
                          (btn: CardWebHeaderBtn) => btn.id === curBtn.id,
                        );
                        newBtns[index] = {
                          ...curBtn,
                          variant: e.target.value as 'contained' | 'outlined',
                        };
                        field.onChange(newBtns);
                        setIsEdit(true);
                      }}
                      sx={{
                        width: '114px',
                        height: '36px',
                        bgcolor: '#ffffff',
                      }}
                    >
                      <MenuItem value={'contained'}>实心</MenuItem>
                      <MenuItem value={'outlined'}>描边</MenuItem>
                      <MenuItem value={'text'}>文字</MenuItem>
                    </Select>
                    <Select
                      value={curBtn.target}
                      onChange={e => {
                        const newBtns = [
                          ...(appPreviewData?.settings.btns || []),
                        ];
                        const index = newBtns.findIndex(
                          (btn: CardWebHeaderBtn) => btn.id === curBtn.id,
                        );
                        newBtns[index] = {
                          ...curBtn,
                          target: e.target.value as '_blank' | '_self',
                        };
                        field.onChange(newBtns);
                        setIsEdit(true);
                      }}
                      sx={{
                        width: '114px',
                        height: '36px',
                        bgcolor: '#ffffff',
                      }}
                    >
                      <MenuItem value={'_self'}>当前窗口</MenuItem>
                      <MenuItem value={'_blank'}>新窗口</MenuItem>
                    </Select>
                  </Stack>
                  <Stack direction={'row'} gap={2}>
                    <Stack direction={'row'} alignItems={'center'} gap={1}>
                      <Checkbox
                        size='small'
                        sx={{ p: 0, m: 0 }}
                        checked={curBtn.showIcon}
                        onChange={e => {
                          const newBtns = [
                            ...(appPreviewData?.settings.btns || []),
                          ];
                          const index = newBtns.findIndex(
                            (btn: CardWebHeaderBtn) => btn.id === curBtn.id,
                          );
                          newBtns[index] = {
                            ...curBtn,
                            showIcon: e.target.checked,
                          };
                          field.onChange(newBtns);
                          setIsEdit(true);
                        }}
                      />
                      <Box sx={{ fontSize: 14, lineHeight: '32px' }}>
                        展示图标
                      </Box>
                    </Stack>
                    <UploadFile
                      name='icon'
                      id={`${curBtn.id}_icon`}
                      type='url'
                      disabled={false}
                      accept='image/*'
                      width={36}
                      value={curBtn.icon}
                      onChange={(url: string) => {
                        console.log(url);
                        const newBtns = [
                          ...(appPreviewData?.settings.btns || []),
                        ];
                        const index = newBtns.findIndex(
                          (btn: CardWebHeaderBtn) => btn.id === curBtn.id,
                        );
                        newBtns[index] = { ...curBtn, icon: url };
                        field.onChange(newBtns);
                        setIsEdit(true);
                      }}
                    />
                  </Stack>
                  <TextField
                    label='请输入按钮文本'
                    sx={{
                      width: '236px',
                      height: '36px',
                      bgcolor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        padding: '0 12px',
                        '& .MuiOutlinedInput-input': {
                          padding: '8px 0',
                        },
                      },
                    }}
                    placeholder='请输入文本'
                    variant='outlined'
                    value={curBtn.text}
                    onChange={e => {
                      const newBtns = [
                        ...(appPreviewData?.settings.btns || []),
                      ];
                      const index = newBtns.findIndex(
                        (btn: CardWebHeaderBtn) => btn.id === curBtn.id,
                      );
                      newBtns[index] = { ...curBtn, text: e.target.value };
                      field.onChange(newBtns);
                      setIsEdit(true);
                    }}
                  />
                  <TextField
                    label='请输入按钮链接'
                    sx={{
                      width: '236px',
                      height: '36px',
                      bgcolor: '#ffffff',
                      '& .MuiOutlinedInput-root': {
                        height: '36px',
                        padding: '0 12px',
                        '& .MuiOutlinedInput-input': {
                          padding: '8px 0',
                        },
                      },
                    }}
                    placeholder='请输入链接'
                    value={curBtn.url}
                    variant='outlined'
                    onChange={e => {
                      const newBtns = [
                        ...(appPreviewData?.settings.btns || []),
                      ];
                      const index = newBtns.findIndex(
                        (btn: CardWebHeaderBtn) => btn.id === curBtn.id,
                      );
                      newBtns[index] = { ...curBtn, url: e.target.value };
                      field.onChange(newBtns);
                      setIsEdit(true);
                    }}
                  />
                </Stack>
              );
            }}
          />

          <Stack
            direction={'column'}
            sx={{ justifyContent: 'space-between', height: '100%' }}
          >
            <IconButton
              size='small'
              onClick={e => {
                e.stopPropagation();
                handleRemove?.(item.id);
              }}
              sx={{
                color: 'text.auxiliary',
                ':hover': { color: 'error.main' },
                fontSize: '12px',
              }}
            >
              <Icon type='icon-shanchu2' />
            </IconButton>
            <IconButton
              size='small'
              sx={{
                cursor: 'grab',
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' },
              }}
              {...dragHandleProps}
            >
              <Icon type='icon-drag' />
            </IconButton>
          </Stack>
        </Stack>
      </Box>
    );
  },
);

export default Item;
