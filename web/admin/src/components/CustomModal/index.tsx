import { useEffect, useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import { CusTabs, Icon, message, Modal } from '@ctzhian/ui';
import {
  getApiV1NodeRecommendNodes,
  getApiV1KnowledgeBaseDetail,
} from '@/request';
import { DomainAppDetailResp } from '@/request/types';
import { getApiV1AppDetail, putApiV1App } from '@/request/App';
import { useAppSelector, useAppDispatch } from '@/store';
import { setAppPreviewData } from '@/store/slices/config';
import ComponentBar from './components/components/ComponentBar';
import ConfigBar from './components/config/ConfigBar';
import ShowContent from './components/ShowContent';
import { COMPONENTS_MAP } from './constants';

interface CustomModalProps {
  open: boolean;
  onCancel: () => void;
}

export interface Component {
  name: string;
  title: string;
  component: React.FC<any>;
  config: React.FC<any>;
  fixed?: boolean;
}

const CustomModal = ({ open, onCancel }: CustomModalProps) => {
  const dispatch = useAppDispatch();
  const { kb_id } = useAppSelector(state => state.config);
  const [info, setInfo] = useState<DomainAppDetailResp>();
  const [renderMode, setRenderMode] = useState<'pc' | 'mobile'>('pc');
  const [components, setComponents] = useState<Component[]>([
    COMPONENTS_MAP.header,
    COMPONENTS_MAP.banner,
    COMPONENTS_MAP.footer,
  ]);
  const [curComponent, setCurComponent] = useState<Component>(components[0]);
  const [isEdit, setIsEdit] = useState(false);
  const [scale, setScale] = useState(1);
  const [baseUrl, setBaseUrl] = useState('');
  const appPreviewData = useAppSelector(state => state.config.appPreviewData);

  const getInfo = async () => {
    const res = await getApiV1AppDetail({ kb_id: kb_id, type: '1' });
    const web_app_landing_settings =
      res.settings?.web_app_landing_settings || {};
    const { basic_doc_config, dir_doc_config, simple_doc_config } =
      web_app_landing_settings;
    await Promise.all([
      basic_doc_config?.list && basic_doc_config.list.length > 0
        ? getApiV1NodeRecommendNodes({
            kb_id,
            node_ids: basic_doc_config.list,
          }).then(res => {
            // @ts-expect-error ignore
            basic_doc_config.docs = res;
          })
        : Promise.resolve(),
      dir_doc_config?.list && dir_doc_config.list.length > 0
        ? getApiV1NodeRecommendNodes({
            kb_id,
            node_ids: dir_doc_config.list,
          }).then(res => {
            // @ts-expect-error ignore
            dir_doc_config.dirs = res;
          })
        : Promise.resolve(),
      simple_doc_config?.list && simple_doc_config.list.length > 0
        ? getApiV1NodeRecommendNodes({
            kb_id,
            node_ids: simple_doc_config.list,
          }).then(res => {
            // @ts-expect-error ignore
            simple_doc_config.docs = res;
          })
        : Promise.resolve(),
    ]);
    setInfo(res);
    dispatch(setAppPreviewData(res));
  };
  const onSubmit = () => {
    if (!info || !appPreviewData) return;
    const com_config_order = components.map(item => item.name);
    const web_app_landing_settings =
      appPreviewData.settings?.web_app_landing_settings || {};
    const {
      basic_doc_config,
      dir_doc_config,
      simple_doc_config,
      banner_config,
    } = web_app_landing_settings;

    putApiV1App(
      { id: info.id! },
      {
        settings: {
          ...info.settings,
          ...appPreviewData.settings,
          web_app_landing_settings: {
            ...web_app_landing_settings,
            basic_doc_config: {
              title: basic_doc_config?.title,
              bg_color: basic_doc_config?.bg_color,
              title_color: basic_doc_config?.title_color,
              // @ts-expect-error ignore
              list: basic_doc_config?.docs?.map(item => item?.id) || [],
            },
            dir_doc_config: {
              title: dir_doc_config?.title,
              bg_color: dir_doc_config?.bg_color,
              title_color: dir_doc_config?.title_color,
              // @ts-expect-error ignore
              list: dir_doc_config?.dirs?.map(item => item?.id) || [],
            },
            simple_doc_config: {
              title: simple_doc_config?.title,
              bg_color: simple_doc_config?.bg_color,
              title_color: simple_doc_config?.title_color,
              // @ts-expect-error ignore
              list: simple_doc_config?.docs?.map(item => item?.id) || [],
            },
            banner_config: {
              ...banner_config,
              title_font_size: +(banner_config?.title_font_size || 0),
              subtitle_font_size: +(banner_config?.subtitle_font_size || 0),
            },
            com_config_order,
          },
        },
        kb_id,
      },
    ).then(() => {
      message.success('保存成功');
      setIsEdit(false);
    });
  };
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2)); // 最大放大到200%
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5)); // 最小缩小到50%
  };

  const resetZoom = () => {
    setScale(1);
  };
  useEffect(() => {
    if (!info) return;
    dispatch(setAppPreviewData(info));
    const com_config_order =
      info.settings?.web_app_landing_settings?.com_config_order;
    if (com_config_order) {
      setComponents(
        com_config_order.map(
          item => COMPONENTS_MAP[item as keyof typeof COMPONENTS_MAP],
        ),
      );
    }
  }, [info]);

  useEffect(() => {
    if (open && kb_id) {
      getApiV1KnowledgeBaseDetail({ id: kb_id }).then(res => {
        if (res.access_settings?.base_url) {
          setBaseUrl(res!.access_settings!.base_url!);
        } else {
          let defaultUrl: string = '';
          const host = res.access_settings?.hosts?.[0] || '';
          if (!host) return;

          if (
            res.access_settings?.ssl_ports &&
            res.access_settings?.ssl_ports.length > 0
          ) {
            defaultUrl = res.access_settings.ssl_ports.includes(443)
              ? `https://${host}`
              : `https://${host}:${res.access_settings.ssl_ports[0]}`;
          } else if (
            res.access_settings?.ports &&
            res.access_settings?.ports.length > 0
          ) {
            defaultUrl = res.access_settings.ports.includes(80)
              ? `http://${host}`
              : `http://${host}:${res.access_settings.ports[0]}`;
          }
          setBaseUrl(defaultUrl);
        }
      });
      getInfo();
    }
  }, [kb_id, open]);

  useEffect(() => {
    if (!open) {
      setScale(1);
    }
  }, [open]);

  return (
    <>
      {open && (
        <Modal
          open={open}
          onCancel={onCancel}
          width={'95%'}
          footer={null}
          style={{}}
          sx={{
            maxWidth: 'none',
            '& .MuiDialog-paper': {
              maxWidth: 'none',
              bgcolor: '#FFFFFF',
              padding: '0px',
              margin: 0,
              maxHeight: '90%',
              height: '90%',
            },
            '& .MuiDialogContent-root': {
              maxWidth: 'none',
              padding: '0px',
              height: '100%',
              display: 'flex',
              overflow: 'hidden',
            },
            '& .MuiDialogTitle-root': {
              padding: '0px',
            },
          }}
          title={
            <Stack
              direction='row'
              gap={2}
              sx={{
                width: '100%',
                bgcolor: '#FFFFFF',
                height: '64px',
                borderBottom: '1px solid #ECEEF1',
                alignItems: 'center',
                paddingLeft: '20px',
              }}
            >
              <Typography
                sx={{
                  fontSize: '16px',
                  lineHeight: '24px',
                  fontWeight: 600,
                }}
              >
                自定义页面
              </Typography>
              <Button
                variant='contained'
                size='small'
                disabled={!isEdit}
                onClick={onSubmit}
              >
                保存
              </Button>

              {appPreviewData && (
                <Stack
                  direction='row'
                  gap={1}
                  alignItems='center'
                  sx={{
                    marginLeft: 'auto',
                    marginRight: '80px',
                    marginTop: '6px',
                  }}
                >
                  <CusTabs
                    list={[
                      {
                        label: (
                          <Icon type='icon-PCduan' sx={{ height: '32px' }} />
                        ),
                        value: 'pc',
                      },
                      {
                        label: (
                          <Icon
                            type='icon-yidongduan'
                            sx={{ height: '32px' }}
                          />
                        ),
                        value: 'mobile',
                      },
                    ]}
                    value={renderMode}
                    onChange={value => {
                      if (value === 'pc' || value === 'mobile') {
                        setRenderMode(value);
                      }
                    }}
                  ></CusTabs>
                  <Stack direction='row' gap={1}>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={zoomOut}
                      sx={{ minWidth: '30px', padding: '4px' }}
                    >
                      -
                    </Button>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={resetZoom}
                      sx={{ minWidth: '60px', padding: '4px' }}
                    >
                      {Math.round(scale * 100)}%
                    </Button>
                    <Button
                      variant='outlined'
                      size='small'
                      onClick={zoomIn}
                      sx={{ minWidth: '30px', padding: '4px' }}
                    >
                      +
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Stack>
          }
        >
          <Stack
            direction={'row'}
            gap={2}
            sx={{
              width: '100%',
              minWidth: 0,
              bgcolor: 'background.paper2',
              minHeight: 0,
              height: '100%',
            }}
          >
            <ComponentBar
              components={components}
              setComponents={setComponents}
              curComponent={curComponent}
              setCurComponent={setCurComponent}
              setIsEdit={setIsEdit}
            />
            {appPreviewData ? (
              <ShowContent
                curComponent={curComponent}
                components={components}
                setComponents={setComponents}
                setIsEdit={setIsEdit}
                setCurComponent={setCurComponent}
                renderMode={renderMode}
                scale={scale}
                baseUrl={baseUrl}
              />
            ) : (
              <Stack sx={{ width: '100%' }}>loading...</Stack>
            )}

            <ConfigBar
              curComponent={curComponent}
              components={components}
              setIsEdit={setIsEdit}
              data={info as any}
              isEdit={isEdit}
            ></ConfigBar>
          </Stack>
        </Modal>
      )}
    </>
  );
};
export default CustomModal;
