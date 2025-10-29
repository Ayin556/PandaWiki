import { DEFAULT_DATA, TYPE_TO_CONFIG_LABEL } from './constants';
import Logo from '@/assets/images/footer-logo.png';

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
    logo: 'https://release.baizhi.cloud/panda-wiki/icon.png',
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

const handleBasicDocProps = (config: any = {}) => {
  return {
    title: config.title || '文档摘要卡片',
    bgColor: config.bg_color || '#ffffff',
    titleColor: config.title_color || '#00000',
    items:
      config.nodes?.map((item: any) => ({
        ...item,
        summary: item.summary || '暂无摘要',
      })) || [],
  };
};

const handleDirDocProps = (config: any = {}) => {
  return {
    title: config.title || '文档目录卡片',
    bgColor: config.bg_color || '#3248F2',
    titleColor: config.title_color || '#ffffff',
    items:
      config.nodes?.map((item: any) => ({
        ...item,
        recommend_nodes: [...(item.recommend_nodes || [])].sort(
          (a: any, b: any) => (a.position ?? 0) - (b.position ?? 0),
        ),
      })) || [],
  };
};

const handleSimpleDocProps = (config: any = {}) => {
  return {
    title: config.title || '简易文档卡片',
    bgColor: config?.bg_color || '#ffffff',
    titleColor: config.title_color || '#000000',
    items:
      config.nodes?.map((item: any) => ({
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

export const handleComponentProps = (
  type: string,
  id: string,
  setting: any,
) => {
  if (type === 'header') {
    return handleHeaderProps(setting);
  } else if (type === 'footer') {
    return handleFooterProps(setting);
  } else {
    const config = (setting.web_app_landing_configs || []).find(
      (c: any) => c.id === id,
    );

    switch (type) {
      case 'faq':
        return handleFaqProps(config);
      case 'basic_doc':
        return handleBasicDocProps(config);
      case 'dir_doc':
        return handleDirDocProps(config);
      case 'simple_doc':
        return handleSimpleDocProps(config);
      case 'carousel':
        return handleCarouselProps(config);
      case 'banner':
        return handleBannerProps(config);
    }
  }
};

export const findConfigById = (configs: any[], id: string) => {
  const config = configs.find(item => item.id === id);
  return config || {};
};

export const handleLandingConfigs = ({
  id,
  config,
  values,
}: {
  id: string;
  config: any[];
  values: any;
}) => {
  return config.map(item => {
    if (item.id === id) {
      return {
        type: item.type,
        id: item.id,
        ...values,
      };
    }
    return item;
  });
};

// 返回与组件强相关的 settings 切片，减少无关字段引发的重渲染
export const getComponentSettingsSlice = (type: string, setting: any) => {
  switch (type) {
    case 'header':
      return {
        title: setting?.title,
        icon: setting?.icon,
        btns: setting?.btns,
        web_app_custom_style: {
          header_search_placeholder:
            setting?.web_app_custom_style?.header_search_placeholder,
        },
      };
    case 'footer':
      return {
        footer_settings: setting?.footer_settings,
        icon: setting?.icon,
        web_app_custom_style: setting?.web_app_custom_style,
      };
    case 'faq':
      return { faq_config: setting?.faq_config };
    case 'basicDoc':
      return { basic_doc_config: setting?.basic_doc_config };
    case 'dirDoc':
      return { dir_doc_config: setting?.dir_doc_config };
    case 'simpleDoc':
      return { simple_doc_config: setting?.simple_doc_config };
    case 'carousel':
      return { carousel_config: setting?.carousel_config };
    case 'banner':
      return { banner_config: setting?.banner_config };
    default:
      return {};
  }
};

// 生成稳定签名，用于 memo 依赖
export const getComponentSettingsSignature = (type: string, setting: any) => {
  const slice = getComponentSettingsSlice(type, setting);
  try {
    return JSON.stringify(slice);
  } catch (e) {
    return '';
  }
};
