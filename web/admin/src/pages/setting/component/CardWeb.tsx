import { Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import CardAuth from './CardAuth';
import CardCatalog from './CardCatalog';
import CardFooter from './CardFooter';
import CardStyle from './CardStyle';
import CardBasicInfo from './CardBasicInfo';
import CardListen from './CardListen';
import CardWebCustomCode from './CardWebCustomCode';
import CardWebHeader from './CardWebHeader';
import CardWebSEO from './CardWebSEO';
import CardWebWelcome from './CardWebWelcome';
import CardProxy from './CardProxy';
import {
  DomainAppDetailResp,
  DomainKnowledgeBaseDetail,
} from '@/request/types';
import { getApiV1AppDetail } from '@/request/App';
import { SettingCard } from './Common';

interface CardWebProps {
  kb: DomainKnowledgeBaseDetail;
  refresh: () => void;
}

const CardWeb = ({ kb, refresh }: CardWebProps) => {
  const [info, setInfo] = useState<DomainAppDetailResp | null>(null);

  const getInfo = async () => {
    const res = await getApiV1AppDetail({ kb_id: kb.id!, type: '1' });
    setInfo(res);
  };

  useEffect(() => {
    getInfo();
  }, [kb]);

  if (!info?.id) return <></>;

  return (
    <SettingCard title='门户网站'>
      <CardListen kb={kb} refresh={refresh} />
      <CardProxy kb={kb} refresh={refresh} />
      <CardBasicInfo kb={kb} refresh={refresh} />
      <CardAuth kb={kb} refresh={refresh} />
      <Divider sx={{ my: 2 }} />
      <CardStyle
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              theme_mode: value.theme_mode,
              theme_and_style: {
                ...info.settings?.theme_and_style,
                bg_image: value.bg_image,
              },
            },
          });
        }}
      />
      <CardWebHeader
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              ...value,
            },
          });
        }}
      />
      <CardCatalog
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              catalog_settings: {
                ...info.settings?.catalog_settings,
                ...value,
              },
            },
          });
        }}
      />
      <CardFooter
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              footer_settings: {
                ...info.settings?.footer_settings,
                ...value,
              },
            },
          });
        }}
      />
      <Divider sx={{ my: 2 }} />
      <CardWebWelcome
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              ...value,
            },
          });
        }}
      />
      <Divider sx={{ my: 2 }} />
      <CardWebSEO
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              ...value,
            },
          });
        }}
      />
      <Divider sx={{ my: 2 }} />
      <CardWebCustomCode
        id={info.id}
        data={info}
        refresh={value => {
          setInfo({
            ...info,
            settings: {
              ...info.settings,
              ...value,
            },
          });
        }}
      />
    </SettingCard>
  );
};
export default CardWeb;
