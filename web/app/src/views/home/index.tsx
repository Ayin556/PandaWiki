'use client';

import {
  Banner,
  Faq,
  BasicDoc,
  DirDoc,
  SimpleDoc,
  Carousel,
  Text,
  Case,
  Metrics,
} from '@panda-wiki/ui';
import { DomainRecommendNodeListResp } from '@/request/types';

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
    title: config.title || '链接组',
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
    title: config.title || '文档摘要卡片',
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
    title: config.title || '文档目录卡片',
    bgColor: config.bg_color || '#3248F2',
    titleColor: config.title_color || '#ffffff',
    items:
      docs?.map(item => ({
        id: item.id,
        name: item.name,
        ...item,
        recommend_nodes: [...(item.recommend_nodes || [])].sort(
          (a, b) => (a.position ?? 0) - (b.position ?? 0),
        ),
      })) || [],
  };
};

const handleSimpleDocProps = (
  config: any = {},
  docs: DomainRecommendNodeListResp[],
) => {
  return {
    title: config.title || '简易文档卡片',
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
    title: config.title || '轮播图',
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

const handleTextProps = (config: any = {}) => {
  return {
    title: config.title || '标题',
  };
};

const handleCaseProps = (config: any = {}) => {
  return {
    title: config.title || '案例',
    items: config.list || [],
  };
};

const handleMetricsProps = (config: any = {}) => {
  return {
    title: config.title || '指标',
    items: config.list || [],
  };
};

const componentMap = {
  banner: Banner,
  basic_doc: BasicDoc,
  dir_doc: DirDoc,
  simple_doc: SimpleDoc,
  carousel: Carousel,
  faq: Faq,
  text: Text,
  case: Case,
  metrics: Metrics,
} as const;

const Welcome = () => {
  const { mobile = false, kbDetail, setQaModalOpen } = useStore();
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
    text: 'text_config',
    case: 'case_config',
    metrics: 'metrics_config',
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
          onQaClick: () => setQaModalOpen?.(true),
          btns: (config?.btns || []).map((item: any) => ({
            ...item,
            href: item.href || '/node',
          })),
        };
      case 'text':
        return handleTextProps(config);
      case 'case':
        return handleCaseProps(config);
      case 'metrics':
        return handleMetricsProps(config);
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
