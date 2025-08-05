import { AuthSetting } from '@/api/type';
import { ConstsSourceType } from '@/request/pro/types';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Select,
  MenuItem,
  Link,
} from '@mui/material';
import NoData from '@/assets/images/nodata.png';
import { putApiV1KnowledgeBaseDetail } from '@/request/KnowledgeBase';
import { DomainKnowledgeBaseDetail } from '@/request/types';
import { GithubComChaitinPandaWikiProApiAuthV1AuthItem } from '@/request/pro/types';
import { getApiProV1AuthGet, postApiProV1AuthSet } from '@/request/pro/Auth';
import InfoIcon from '@mui/icons-material/Info';
import { Message, Table, Icon } from 'ct-mui';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useAppSelector } from '@/store';

interface CardAuthProps {
  kb: DomainKnowledgeBaseDetail;
  refresh: (value: AuthSetting) => void;
}

const sourceTypeIcon = {
  [ConstsSourceType.SourceTypeDingTalk]: 'icon-dingdingjiqiren',
  [ConstsSourceType.SourceTypeFeishu]: 'icon-feishujiqiren',
  [ConstsSourceType.SourceTypeWeCom]: 'icon-qiyeweixinjiqiren',
};

const CardAuth = ({ kb, refresh }: CardAuthProps) => {
  const { license, kb_id } = useAppSelector((state) => state.config);
  const [isEdit, setIsEdit] = useState(false);
  const [memberList, setMemberList] = useState<
    GithubComChaitinPandaWikiProApiAuthV1AuthItem[]
  >([]);
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      enabled: '1',
      password: '',
      client_id: '',
      client_secret: '',
      source_type:
        kb.access_settings?.source_type || ConstsSourceType.SourceTypeDingTalk,
      agent_id: '',
    },
  });

  const source_type = watch('source_type');

  const enabled = watch('enabled');

  const onSubmit = handleSubmit((value) => {
    Promise.all([
      putApiV1KnowledgeBaseDetail({
        id: kb.id!,
        access_settings: {
          ...kb.access_settings,
          simple_auth: {
            enabled: value.enabled === '2',
            password: value.password,
          },
          enterprise_auth: {
            enabled: value.enabled === '3',
          },
          source_type: value.source_type,
        },
      }),
      value.enabled === '3' && isPro
        ? postApiProV1AuthSet({
            kb_id,
            sourceType: value.source_type,
            clientID: value.client_id,
            clientSecret: value.client_secret,
            agent_id: value.agent_id,
          })
        : Promise.resolve(),
    ]).then(() => {
      refresh({
        enabled: value.enabled === '2',
        password: value.password,
      });
      Message.success('保存成功');
      setIsEdit(false);
    });
  });

  const isPro = useMemo(() => {
    return license.edition === 1 || license.edition === 2;
  }, [license]);

  useEffect(() => {
    setValue(
      'source_type',
      kb.access_settings?.source_type || ConstsSourceType.SourceTypeDingTalk
    );
  }, [kb]);

  useEffect(() => {
    if (kb.access_settings?.simple_auth) {
      setValue('enabled', kb.access_settings.simple_auth.enabled ? '2' : '1');
      setValue('password', kb.access_settings.simple_auth.password ?? '');
    }
    if (kb.access_settings?.enterprise_auth?.enabled && isPro) {
      setValue('enabled', '3');
    }
  }, [kb, isPro]);

  useEffect(() => {
    if (!isPro || !kb_id || enabled !== '3') return;
    getApiProV1AuthGet({
      kb_id,
      source_type: source_type,
    }).then((res) => {
      setMemberList(res.auths || []);
      setValue('client_id', res.client_id!);
      setValue('client_secret', res.client_secret!);
      setValue('agent_id', res.agent_id!);
    });
  }, [kb_id, isPro, source_type, enabled]);

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      render: (text: string) => {
        return (
          <Stack direction={'row'} alignItems={'center'} gap={1}>
            <Icon type={sourceTypeIcon[source_type]} sx={{ fontSize: 16 }} />
            {text}
          </Stack>
        );
      },
    },
    {
      title: 'created_at',
      dataIndex: 'created_at',
      render: (
        text: string,
        record: GithubComChaitinPandaWikiProApiAuthV1AuthItem
      ) => {
        return (
          <Box sx={{ color: 'text.secondary' }}>
            {dayjs(text).fromNow()}加入，
            {dayjs(record.last_login_time).fromNow()}活跃
          </Box>
        );
      },
    },
  ];

  return (
    <>
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
          访问认证{' '}
        </Box>
        <Box sx={{ flexGrow: 1, ml: 1 }}>
          <Link
            component='a'
            href='https://pandawiki.docs.baizhi.cloud/node/01986040-602c-736c-b99f-0b3cb9bb89e5'
            target='_blank'
            sx={{
              fontSize: 14,
              textDecoration: 'none',
              fontWeight: 'normal',
              '&:hover': {
                fontWeight: 'bold',
              },
            }}
          >
            使用方法
          </Link>
        </Box>
        {isEdit && (
          <Button variant='contained' size='small' onClick={onSubmit}>
            保存
          </Button>
        )}
      </Stack>
      <Stack direction={'row'} gap={2} sx={{ mx: 2, mb: 2 }}>
        <Box
          sx={{ width: 156, fontSize: 14, lineHeight: '32px', flexShrink: 0 }}
        >
          可访问性
        </Box>
        <Controller
          control={control}
          name='enabled'
          render={({ field }) => (
            <RadioGroup
              row
              {...field}
              value={field.value}
              onChange={(e) => {
                field.onChange(e.target.value);
                setIsEdit(true);
              }}
            >
              <FormControlLabel
                value={'1'}
                control={<Radio size='small' />}
                label={<Box sx={{ width: 65 }}>公开访问</Box>}
              />
              <FormControlLabel
                value={'2'}
                control={<Radio size='small' />}
                label={<Box sx={{ width: 95 }}>简单口令访问</Box>}
              />
              <FormControlLabel
                value={'3'}
                control={<Radio size='small' disabled={!isPro} />}
                label={
                  <Stack
                    direction='row'
                    alignItems='center'
                    gap={0.5}
                    sx={{ width: 135 }}
                  >
                    企业级身份认证
                    {!isPro && (
                      <Tooltip title='联创版和企业版可用' placement='top' arrow>
                        <InfoIcon
                          sx={{ color: 'text.secondary', fontSize: 14 }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                }
              />
            </RadioGroup>
          )}
        />
      </Stack>
      {enabled === '2' && (
        <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mx: 2 }}>
          <Box
            sx={{ width: 156, fontSize: 14, lineHeight: '32px', flexShrink: 0 }}
          >
            访问口令
          </Box>
          <Controller
            control={control}
            name='password'
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                onChange={(e) => {
                  field.onChange(e.target.value);
                  setIsEdit(true);
                }}
                placeholder='输入访问口令'
              />
            )}
          />
        </Stack>
      )}
      {enabled === '3' && (
        <>
          <Stack direction={'row'} gap={2} alignItems={'center'} sx={{ mx: 2 }}>
            <Box
              sx={{
                width: 156,
                fontSize: 14,
                lineHeight: '32px',
                flexShrink: 0,
              }}
            >
              登录方式
            </Box>
            <Controller
              control={control}
              name='source_type'
              render={({ field }) => (
                <Select
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setIsEdit(true);
                  }}
                  fullWidth
                  sx={{ height: 53 }}
                >
                  <MenuItem value={ConstsSourceType.SourceTypeDingTalk}>
                    钉钉登录
                  </MenuItem>
                  <MenuItem value={ConstsSourceType.SourceTypeFeishu}>
                    飞书登录
                  </MenuItem>
                  <MenuItem value={ConstsSourceType.SourceTypeWeCom}>
                    企业微信登录
                  </MenuItem>
                </Select>
              )}
            />
          </Stack>

          <Stack
            direction={'row'}
            gap={2}
            alignItems={'center'}
            sx={{ mx: 2, mt: 2 }}
          >
            <Box
              sx={{
                width: 156,
                fontSize: 14,
                lineHeight: '32px',
                flexShrink: 0,
              }}
            >
              Client ID
            </Box>
            <Controller
              control={control}
              name='client_id'
              rules={{
                required: {
                  value: true,
                  message: 'Client Id 不能为空',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setIsEdit(true);
                  }}
                  fullWidth
                  placeholder='请输入'
                  error={!!errors.client_id}
                  helperText={errors.client_id?.message}
                />
              )}
            />
          </Stack>
          <Stack
            direction={'row'}
            gap={2}
            alignItems={'center'}
            sx={{ mx: 2, mt: 2 }}
          >
            <Box
              sx={{
                width: 156,
                fontSize: 14,
                lineHeight: '32px',
                flexShrink: 0,
              }}
            >
              Client Secret
            </Box>
            <Controller
              control={control}
              name='client_secret'
              rules={{
                required: {
                  value: true,
                  message: ' Client Secret 不能为空',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setIsEdit(true);
                  }}
                  placeholder='请输入'
                  error={!!errors.client_secret}
                  helperText={errors.client_secret?.message}
                />
              )}
            />
          </Stack>
          {source_type === ConstsSourceType.SourceTypeWeCom && (
            <Stack
              direction={'row'}
              gap={2}
              alignItems={'center'}
              sx={{ mx: 2, mt: 2 }}
            >
              <Box
                sx={{
                  width: 156,
                  fontSize: 14,
                  lineHeight: '32px',
                  flexShrink: 0,
                }}
              >
                Agent ID
              </Box>
              <Controller
                control={control}
                name='agent_id'
                rules={{
                  required: {
                    value: true,
                    message: 'Agent ID  不能为空',
                  },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      setIsEdit(true);
                    }}
                    placeholder='请输入'
                    error={!!errors.agent_id}
                    helperText={errors.agent_id?.message}
                  />
                )}
              />
            </Stack>
          )}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              m: 2,
              height: 32,
              fontWeight: 'bold',
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
            成员{' '}
          </Box>
          <Table
            columns={columns}
            dataSource={memberList}
            showHeader={false}
            rowKey='id'
            size='small'
            sx={{
              mx: 2,
              '.MuiTableContainer-root': {
                maxHeight: 400,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: '10px',
                borderBottom: 'none',
              },

              '.MuiTableCell-root': {
                px: 2,
                height: 'auto !important',
              },
              '.MuiTableRow-root': {
                '&:hover': {
                  '.MuiTableCell-root': {
                    backgroundColor: 'transparent !important',
                  },
                },
              },
            }}
            renderEmpty={
              <Stack alignItems={'center'} sx={{ mt: 20 }}>
                <img src={NoData} width={174} />
                <Box>暂无数据</Box>
              </Stack>
            }
          />
        </>
      )}
    </>
  );
};

export default CardAuth;
