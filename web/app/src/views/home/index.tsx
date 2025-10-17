'use client';

import {
  Banner,
  Faq,
  BasicDoc,
  DirDoc,
  SimpleDoc,
  Carousel,
} from '@panda-wiki/ui';
import { DomainRecommendNodeListResp } from '@/request/types';
import { useRouter } from 'next/navigation';

import { useStore } from '@/provider';

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

const handleFaqProps = (config: any = {}) => {
  return {
    title: config.title || '常见问题',
    bgColor: config.bg_color || '#ffffff',
    titleColor: config.title_color || '#000000',
    items:
      config.list?.map((item: any) => ({
        question: item.question,
        url: item.link,
      })) || [],
  };
};

const handleBasicDocProps = (
  config: any = {},
  docs: DomainRecommendNodeListResp[],
) => {
  return {
    title: config.title || '基础文档',
    bgColor: config.bg_color || '#ffffff',
    titleColor: config.title_color || '#00000',
    items:
      docs?.map(item => ({
        ...item,
        summary: item.summary || '暂无摘要',
      })) || [],
  };
};

const handleDirDocProps = (
  config: any = {},
  docs: DomainRecommendNodeListResp[],
) => {
  return {
    title: config.title || '目录文档',
    bgColor: config.bg_color || '#3248F2',
    titleColor: config.title_color || '#ffffff',
    items:
      docs?.map(item => ({
        id: item.id,
        name: item.name,
        ...item,
        recommend_nodes: item.recommend_nodes || [],
      })) || [],
  };
};

const handleSimpleDocProps = (
  config: any = {},
  docs: DomainRecommendNodeListResp[],
) => {
  return {
    title: config.title || '简易文档',
    bgColor: config.bg_color || '#ffffff',
    titleColor: config.title_color || '#000000',
    items:
      docs?.map(item => ({
        ...item,
      })) || [],
  };
};

const handleCarouselProps = (config: any = {}) => {
  return {
    title: config.title || '轮播图展示',
    bgColor: config.bg_color || '#3248F2',
    titleColor: config.title_color || '#ffffff',
    items:
      config.list?.map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        desc: item.desc,
      })) || [],
  };
};

const handleBannerProps = (config: any = {}) => {
  console.log(config, 'config-------------', config.btns || []);
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
  basic_doc: BasicDoc,
  dir_doc: DirDoc,
  simple_doc: SimpleDoc,
  carousel: Carousel,
  faq: Faq,
} as const;

const Welcome = () => {
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

  const TYPE_TO_CONFIG_LABEL = {
    banner: 'banner_config',
    basic_doc: 'basic_doc_config',
    dir_doc: 'dir_doc_config',
    simple_doc: 'simple_doc_config',
    carousel: 'carousel_config',
    faq: 'faq_config',
  } as const;

  const handleComponentProps = (data: any) => {
    const config =
      data[
        TYPE_TO_CONFIG_LABEL[data.type as keyof typeof TYPE_TO_CONFIG_LABEL]
      ];

    switch (data.type) {
      case 'faq':
        return handleFaqProps(config);
      case 'basic_doc':
        return handleBasicDocProps(config, data.nodes);
      case 'dir_doc':
        return handleDirDocProps(config, data.nodes);
      case 'simple_doc':
        return handleSimpleDocProps(config, data.nodes);
      case 'carousel':
        return handleCarouselProps(config);
      case 'banner':
        return {
          ...handleBannerProps(config),
          onSearch: onBannerSearch,
          btns: (config?.btns || []).map((item: any) => ({
            ...item,
            href: item.href || '/node',
          })),
        };
    }
  };
  return (
    <>
      {settings?.web_app_landing_configs?.map((item, index) => {
        const Component = componentMap[item.type as keyof typeof componentMap];
        const props = handleComponentProps(item);
        return Component ? (
          // @ts-ignore
          <Component key={index} mobile={mobile} {...props} />
        ) : null;
      })}
    </>
  );
};

export default Welcome;
