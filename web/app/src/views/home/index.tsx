'use client';

import {
  Banner,
  Faq,
  BasicDoc,
  DirDoc,
  SimpleDoc,
  Carousel,
} from '@panda-wiki/ui';

import { useRouter } from 'next/navigation';
import { useStore } from '@/provider';
import { V1NodeRecommendListResp } from '@/request/types';

const handleHeaderProps = (setting: any) => {
  return {
    title: setting.title,
    logo: setting.icon,
    btns: setting.btns,
    placeholder:
      setting.web_app_custom_style?.header_search_placeholder || '搜索...',
  };
};

const handleFooterProps = (setting: any) => {
  return {
    footerSetting: setting.footer_settings,
    logo: setting.icon,
    showBrand: setting.web_app_custom_style?.show_brand_info || false,
    customStyle: setting.web_app_custom_style,
  };
};

const handleFaqProps = (setting: any) => {
  const config = setting.web_app_landing_settings || {};
  return {
    title: config.faq_config?.title || '常见问题',
    bgColor: config.faq_config?.bg_color || '#ffffff',
    titleColor: config.faq_config?.title_color || '#000000',
    items:
      config.faq_config?.list?.map((item: any) => ({
        question: item.question,
        url: item.link,
      })) || [],
  };
};

const handleBasicDocProps = (setting: any, docs: V1NodeRecommendListResp) => {
  const config = setting.web_app_landing_settings || {};
  return {
    title: config.basic_doc_config?.title || '基础文档',
    bgColor: config.basic_doc_config?.bg_color || '#ffffff',
    titleColor: config.basic_doc_config?.title_color || '#00000',
    items:
      docs.basic_docs?.map((item: any) => ({
        ...item,
        summary: item.summary || '暂无摘要',
      })) || [],
  };
};

const handleDirDocProps = (setting: any, docs: V1NodeRecommendListResp) => {
  const config = setting.web_app_landing_settings || {};
  return {
    title: config.dir_doc_config?.title || '目录文档',
    bgColor: config.dir_doc_config?.bg_color || '#3248F2',
    titleColor: config.dir_doc_config?.title_color || '#ffffff',
    items:
      docs.dir_docs?.map((item: any) => ({
        id: item.id,
        name: item.name,
        ...item,
        recommend_nodes: item.recommend_nodes || [],
      })) || [],
  };
};

const handleSimpleDocProps = (setting: any, docs: V1NodeRecommendListResp) => {
  const config = setting.web_app_landing_settings || {};
  return {
    title: config.simple_doc_config?.title || '简易文档',
    bgColor: config.simple_doc_config?.bg_color || '#ffffff',
    titleColor: config.simple_doc_config?.title_color || '#000000',
    items:
      docs.simple_docs?.map((item: any) => ({
        ...item,
      })) || [],
  };
};

const handleCarouselProps = (setting: any) => {
  const config = setting.web_app_landing_settings || {};
  return {
    title: config.carousel_config?.title || '轮播图展示',
    bgColor: config.carousel_config?.bg_color || '#3248F2',
    titleColor: config.carousel_config?.title_color || '#ffffff',
    items:
      config.carousel_config?.list?.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        desc: item.desc,
      })) || [],
  };
};

const handleBannerProps = (setting: any) => {
  const config = setting.web_app_landing_settings?.banner_config || {};
  return {
    title: {
      text: config.title,
      color: config.title_color,
      fontSize: config.title_font_size,
    },
    subtitle: {
      text: config.subtitle,
      color: config.subtitle_color,
      fontSize: config.subtitle_font_size,
    },
    bg_url: config.bg_url,
    search: {
      placeholder: config.placeholder,
      hot: config.hot_search,
    },
    btns: config.btns || [],
  };
};

const componentMap = {
  banner: Banner,
  basicDoc: BasicDoc,
  dirDoc: DirDoc,
  simpleDoc: SimpleDoc,
  carousel: Carousel,
  faq: Faq,
};

const Welcome = ({ docs }: { docs: V1NodeRecommendListResp }) => {
  const {
    mobile = false,
    kbDetail,
    setSearchModalOpen,
    setQaModalOpen,
  } = useStore();
  const settings = kbDetail?.settings;
  const onBannerSearch = (
    searchText: string,
    type: 'chat' | 'search' = 'chat',
  ) => {
    if (searchText.trim()) {
      if (type === 'chat') {
        sessionStorage.setItem('chat_search_query', searchText.trim());
        setQaModalOpen?.(true);
      } else {
        sessionStorage.setItem('chat_search_query', searchText.trim());
        setSearchModalOpen?.(true);
      }
    }
  };

  const handleComponentProps = (
    type: string,
    setting: any,
    docs: V1NodeRecommendListResp,
  ) => {
    switch (type) {
      case 'header':
        return { ...handleHeaderProps(setting), onSearch: onBannerSearch };
      case 'footer':
        return handleFooterProps(setting);
      case 'faq':
        return handleFaqProps(setting);
      case 'basicDoc':
        return handleBasicDocProps(setting, docs);
      case 'dirDoc':
        return handleDirDocProps(setting, docs);
      case 'simpleDoc':
        return handleSimpleDocProps(setting, docs);
      case 'carousel':
        return handleCarouselProps(setting);
      case 'banner':
        return {
          ...handleBannerProps(setting),
          onSearch: onBannerSearch,
          btns: setting.web_app_landing_settings?.banner_config?.btns?.map(
            (item: any) => ({
              ...item,
              href: item.href || '/node',
            }),
          ),
        };
    }
  };

  return (
    <>
      {settings?.web_app_landing_settings?.com_config_order?.map(
        (key: string) => {
          const Component = componentMap[key as keyof typeof componentMap]!;
          const props = handleComponentProps(key, settings, docs);
          return Component ? (
            // @ts-ignore
            <Component key={key} mobile={mobile} {...props} />
          ) : null;
        },
      )}
    </>
  );
};

export default Welcome;
