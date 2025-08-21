import { useEffect, useState, useMemo } from 'react';
import { Form, FormItem } from '@/pages/setting/component/Common';
import { Modal, Icon, Message } from 'ct-mui';
import InfoIcon from '@mui/icons-material/Info';
import {
  ConstsNodeAccessPerm,
  GithubComChaitinPandaWikiProApiAuthV1AuthGroupListItem,
} from '@/request/pro/types';
import { DomainNodeListItemResp } from '@/request/types';
import dayjs from 'dayjs';
import {
  RadioGroup,
  Radio,
  TextField,
  styled,
  Stack,
  Button,
  Select,
  MenuItem,
  Box,
  Tooltip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { FormControlLabel } from '@mui/material';
import { postApiV1NodeSummary, putApiV1NodeDetail } from '@/request/Node';
import { getApiProV1AuthGroupList } from '@/request/pro/AuthGroup';
import {
  getApiProV1NodePermission,
  patchApiProV1NodePermissionEdit,
} from '@/request/pro/NodePermission';
import { useAppSelector } from '@/store';

interface DocPropertiesModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: () => void;
  data: DomainNodeListItemResp;
}

const tips = '联创版/企业版可用';

const StyledText = styled('div')(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: 16,
}));

const PER_OPTIONS = [
  {
    label: '完全开放',
    value: ConstsNodeAccessPerm.NodeAccessPermOpen,
  },
  {
    label: '部分开放',
    value: ConstsNodeAccessPerm.NodeAccessPermPartial,
  },
  {
    label: '完全禁止',
    value: ConstsNodeAccessPerm.NodeAccessPermClosed,
  },
];

const DocPropertiesModal = ({
  open,
  onCancel,
  data,
  onOk,
}: DocPropertiesModalProps) => {
  const { kb_id, license } = useAppSelector(state => state.config);
  const [loading, setLoading] = useState(false);
  const [userGroups, setUserGroups] = useState<
    GithubComChaitinPandaWikiProApiAuthV1AuthGroupListItem[]
  >([]);
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      name: '',
      answerable: null as ConstsNodeAccessPerm | null,
      visitable: null as ConstsNodeAccessPerm | null,
      visible: null as ConstsNodeAccessPerm | null,
      summary: '',
      answerable_groups: [] as number[],
      visitable_groups: [] as number[],
      visible_groups: [] as number[],
    },
  });

  const watchAnswerable = watch('answerable');
  const watchVisitable = watch('visitable');
  const watchVisible = watch('visible');

  const onGenerateSummary = () => {
    setLoading(true);
    postApiV1NodeSummary({
      ids: [data.id!],
      kb_id: kb_id!,
    })
      .then(res => {
        console.log(res);
        // @ts-expect-error 类型不匹配
        setValue('summary', res.summary);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const onSubmit = handleSubmit(values => {
    Promise.all([
      isPro
        ? patchApiProV1NodePermissionEdit({
            kb_id: kb_id!,
            id: data.id!,
            permissions: {
              answerable: values.answerable as ConstsNodeAccessPerm,
              visitable: values.visitable as ConstsNodeAccessPerm,
              visible: values.visible as ConstsNodeAccessPerm,
            },
            answerable_groups: values.answerable_groups,
            visitable_groups: values.visitable_groups,
            visible_groups: values.visible_groups,
          })
        : Promise.resolve(),
      putApiV1NodeDetail({
        id: data.id!,
        name: values.name,
        summary: values.summary,
        kb_id: kb_id!,
      }),
    ]).then(() => {
      Message.success('编辑成功');
      onOk();
    });
  });

  const isPro = useMemo(() => {
    return license.edition === 1 || license.edition === 2;
  }, [license]);

  useEffect(() => {
    if (open && data) {
      setValue('name', data.name!);
      setValue('summary', data.summary!);
      if (isPro) {
        getApiProV1NodePermission({
          kb_id: kb_id!,
          id: data.id!,
        }).then(res => {
          const permissions = res.permissions!;
          if (permissions) {
            setValue('answerable', permissions.answerable!);
            setValue('visitable', permissions.visitable!);
            setValue('visible', permissions.visible!);
          }
          setValue(
            'answerable_groups',
            res.answerable_groups?.map(item => item.auth_group_id!) || [],
          );
          setValue(
            'visitable_groups',
            res.visitable_groups?.map(item => item.auth_group_id!) || [],
          );
          setValue(
            'visible_groups',
            res.visible_groups?.map(item => item.auth_group_id!) || [],
          );
        });
        getApiProV1AuthGroupList({
          kb_id: kb_id!,
          page: 1,
          per_page: 9999,
        }).then(res => {
          setUserGroups(res.list || []);
        });
      }
    }
  }, [open, data, isPro]);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open]);

  return (
    <Modal
      title='文档属性'
      open={open}
      onCancel={onCancel}
      width={700}
      okButtonProps={{
        loading: loading,
      }}
      onOk={onSubmit}
    >
      <Form labelWidth={100} gap={3}>
        <FormItem label='文档名称' required>
          <Controller
            name='name'
            control={control}
            rules={{ required: '文档名称不能为空' }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                error={!!errors.name}
                helperText={errors.name?.message as string}
              />
            )}
          />
        </FormItem>
        <FormItem label='创建时间'>
          <StyledText>
            {data?.created_at
              ? dayjs(data.created_at).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </StyledText>
        </FormItem>
        <FormItem label='创建者'>
          <StyledText>{data?.creator}</StyledText>
        </FormItem>
        <FormItem label='修改时间'>
          <StyledText>
            {data?.updated_at
              ? dayjs(data.updated_at).format('YYYY-MM-DD HH:mm:ss')
              : '-'}
          </StyledText>
        </FormItem>
        <FormItem label='修改者'>
          <StyledText>{data?.editor}</StyledText>
        </FormItem>
        <FormItem
          label={
            <Stack direction='row' alignItems='center' gap={0.5}>
              <Box>可被问答</Box>
              {!isPro && (
                <Tooltip title={tips} placement='top' arrow>
                  <InfoIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                </Tooltip>
              )}
            </Stack>
          }
        >
          <Controller
            name='answerable'
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field}>
                {PER_OPTIONS.map(option => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio size='small' />}
                    label={option.label}
                    disabled={!isPro}
                  />
                ))}
              </RadioGroup>
            )}
          />
        </FormItem>
        {watchAnswerable === ConstsNodeAccessPerm.NodeAccessPermPartial && (
          <FormItem label=' '>
            <Controller
              name='answerable_groups'
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  {...field}
                  fullWidth
                  slotProps={{
                    select: {
                      multiple: true,
                    },
                  }}
                  placeholder='请选择可被问答的组'
                >
                  {userGroups.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </FormItem>
        )}

        <FormItem
          label={
            <Stack direction='row' alignItems='center' gap={0.5}>
              <Box>可被访问</Box>
              {!isPro && (
                <Tooltip title={tips} placement='top' arrow>
                  <InfoIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                </Tooltip>
              )}
            </Stack>
          }
        >
          <Controller
            name='visitable'
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field}>
                {PER_OPTIONS.map(option => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio size='small' />}
                    label={option.label}
                    disabled={!isPro}
                  />
                ))}
              </RadioGroup>
            )}
          />
        </FormItem>
        {watchVisitable === ConstsNodeAccessPerm.NodeAccessPermPartial && (
          <FormItem label=' '>
            <Controller
              name='visitable_groups'
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  {...field}
                  fullWidth
                  slotProps={{
                    select: {
                      multiple: true,
                    },
                  }}
                >
                  {userGroups.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </FormItem>
        )}

        <FormItem
          label={
            <Stack direction='row' alignItems='center' gap={0.5}>
              <Box>可被问答</Box>
              {!isPro && (
                <Tooltip title={tips} placement='top' arrow>
                  <InfoIcon sx={{ color: 'text.secondary', fontSize: 14 }} />
                </Tooltip>
              )}
            </Stack>
          }
        >
          <Controller
            name='visible'
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field}>
                {PER_OPTIONS.map(option => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio size='small' />}
                    label={option.label}
                    disabled={!isPro}
                  />
                ))}
              </RadioGroup>
            )}
          />
        </FormItem>
        {watchVisible === ConstsNodeAccessPerm.NodeAccessPermPartial && (
          <FormItem label=' '>
            <Controller
              name='visible_groups'
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  {...field}
                  fullWidth
                  slotProps={{
                    select: {
                      multiple: true,
                    },
                  }}
                >
                  {userGroups.map(option => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </FormItem>
        )}
        <FormItem label='内容摘要' sx={{ alignItems: 'flex-start' }}>
          <Controller
            name='summary'
            control={control}
            render={({ field }) => (
              <Stack sx={{ flex: 1 }} alignItems='flex-start'>
                <TextField
                  {...field}
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message as string}
                  multiline
                  minRows={4}
                />
                <Button
                  sx={{ minWidth: 'auto', mt: 1 }}
                  onClick={onGenerateSummary}
                  disabled={loading}
                  startIcon={
                    <Icon
                      type='icon-shuaxin'
                      sx={
                        loading
                          ? { animation: 'loadingRotate 1s linear infinite' }
                          : {}
                      }
                    />
                  }
                >
                  AI 生成
                </Button>
              </Stack>
            )}
          />
        </FormItem>
      </Form>
    </Modal>
  );
};

export default DocPropertiesModal;
