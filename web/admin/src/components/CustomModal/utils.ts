import { DEFAULT_DATA } from './constants';
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
    logo: Logo,
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

const handleBasicDocProps = (setting: any) => {
  const config = setting.web_app_landing_settings || {};
  return {
    title: config.basic_doc_config?.title || '基础文档',
    bgColor: config.basic_doc_config?.bg_color || '#ffffff',
    titleColor: config.basic_doc_config?.title_color || '#00000',
    items:
      config.basic_doc_config?.docs?.map((item: any) => ({
        id: item.id,
        name: item.name,
        summary: item.summary || '暂无摘要',
      })) || [],
  };
};

const handleDirDocProps = (setting: any) => {
  const config = setting.web_app_landing_settings || {};
  return {
    title: config.dir_doc_config?.title || '目录文档',
    bgColor: config.dir_doc_config?.bg_color || '#3248F2',
    titleColor: config.dir_doc_config?.title_color || '#ffffff',
    items:
      config.dir_doc_config?.dirs?.map((item: any) => ({
        id: item.id,
        name: item.name,
        recommend_nodes: item.recommend_nodes || [],
      })) || [],
  };
};

const handleSimpleDocProps = (setting: any) => {
  const config = setting.web_app_landing_settings || {};
  return {
    title: config.simple_doc_config?.title || '简易文档',
    bgColor: config.simple_doc_config?.bg_color || '#ffffff',
    titleColor: config.simple_doc_config?.title_color || '#000000',
    items:
      config.simple_doc_config?.docs?.map((item: any) => ({
        id: item.id,
        name: item.name,
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
  const config =
    setting.web_app_landing_settings?.banner_config || DEFAULT_DATA.banner;
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

export const handleComponentProps = (type: string, setting: any) => {
  switch (type) {
    case 'header':
      return handleHeaderProps(setting);
    case 'footer':
      return handleFooterProps(setting);
    case 'faq':
      return handleFaqProps(setting);
    case 'basicDoc':
      return handleBasicDocProps(setting);
    case 'dirDoc':
      return handleDirDocProps(setting);
    case 'simpleDoc':
      return handleSimpleDocProps(setting);
    case 'carousel':
      return handleCarouselProps(setting);
    case 'banner':
      return handleBannerProps(setting);
  }
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
