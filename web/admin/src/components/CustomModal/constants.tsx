import { lazy } from 'react';
import {
  IconMuluwendang,
  IconJichuwendang,
  IconJianyiwendang,
  IconChangjianwenti,
  IconLunbotu,
} from '@panda-wiki/icons';
import { DomainRecommendNodeListResp } from '@/request/types';

export const DEFAULT_DATA = {
  text: {
    title: '标题',
  },
  metrics: {
    title: '指标卡片',
    list: [] as {
      name: string;
      number: string;
      id: string;
    }[],
  },
  case: {
    title: '案例卡片',
    list: [] as {
      id: string;
      name: string;
      link: string;
    }[],
  },
  banner: {
    title: '',
    title_color: '#6E73FE',
    title_font_size: 60,
    subtitle: '',
    placeholder: '',
    subtitle_color: '#ffffff80',
    subtitle_font_size: 16,
    bg_url: '',
    hot_search: [] as string[],
    btns: [] as {
      id: string;
      text: string;
      type: 'contained' | 'outlined' | 'text';
      href: string;
    }[],
  },
  basic_doc: {
    title: '文档摘要卡片',
    bg_color: '#ffffff00',
    title_color: '#000000',
    nodes: [] as DomainRecommendNodeListResp[],
  },
  dir_doc: {
    title: '文档目录卡片',
    bg_color: '#3248F2',
    title_color: '#ffffff',
    nodes: [] as DomainRecommendNodeListResp[],
  },
  simple_doc: {
    title: '简易文档卡片',
    bg_color: '#ffffff00',
    title_color: '#000000',
    nodes: [] as DomainRecommendNodeListResp[],
  },
  carousel: {
    title: '轮播图',
    bg_color: '#3248F2',
    title_color: '#ffffff',
    list: [] as {
      id: string;
      title: string;
      url: string;
      desc: string;
    }[],
  },
  faq: {
    title: '链接组',
    bg_color: '#ffffff00',
    title_color: '#000000',
    list: [] as {
      id: string;
      question: string;
      link: string;
    }[],
  },
};

export const COMPONENTS_MAP = {
  header: {
    name: 'header',
    title: '顶部导航',
    component: lazy(() => import('@panda-wiki/ui/welcomeHeader')),
    config: lazy(() => import('./components/config/HeaderConfig')),
    fixed: true,
    disabled: false,
  },
  banner: {
    name: 'banner',
    title: '欢迎组件',
    component: lazy(() => import('@panda-wiki/ui/banner')),
    config: lazy(() => import('./components/config/BannerConfig')),
    fixed: true,
    disabled: false,
  },
  basic_doc: {
    name: 'basic_doc',
    title: '文档摘要卡片',
    icon: IconJichuwendang,
    component: lazy(() => import('@panda-wiki/ui/basicDoc')),
    config: lazy(() => import('./components/config/BasicDocConfig')),
    fixed: false,
    disabled: false,
  },
  dir_doc: {
    name: 'dir_doc',
    title: '文档目录卡片',
    icon: IconMuluwendang,
    component: lazy(() => import('@panda-wiki/ui/dirDoc')),
    config: lazy(() => import('./components/config/DirDocConfig')),
    fixed: false,
    disabled: false,
  },
  simple_doc: {
    name: 'simple_doc',
    title: '简易文档卡片',
    icon: IconJianyiwendang,
    component: lazy(() => import('@panda-wiki/ui/simpleDoc')),
    config: lazy(() => import('./components/config/SimpleDocConfig')),
    fixed: false,
    disabled: false,
  },
  carousel: {
    name: 'carousel',
    title: '轮播图',
    icon: IconLunbotu,
    component: lazy(() => import('@panda-wiki/ui/carousel')),
    config: lazy(() => import('./components/config/CarouselConfig')),
    fixed: false,
    disabled: false,
  },
  faq: {
    name: 'faq',
    title: '链接组',
    icon: IconChangjianwenti,
    component: lazy(() => import('@panda-wiki/ui/faq')),
    config: lazy(() => import('./components/config/FaqConfig')),
    fixed: false,
    disabled: false,
  },
  footer: {
    name: 'footer',
    title: '底部导航',
    component: lazy(() => import('@panda-wiki/ui/welcomeFooter')),
    config: lazy(() => import('./components/config/FooterConfig')),
    fixed: true,
    disabled: false,
  },
  text: {
    name: 'text',
    title: '标题',
    component: lazy(() => import('@panda-wiki/ui/text')),
    config: lazy(() => import('./components/config/TextConfig')),
    fixed: false,
    disabled: false,
  },
  case: {
    name: 'case',
    title: '案例卡片',
    component: lazy(() => import('@panda-wiki/ui/case')),
    config: lazy(() => import('./components/config/CaseConfig')),
    fixed: false,
    disabled: false,
  },
  metrics: {
    name: 'metrics',
    title: '指标卡片',
    component: lazy(() => import('@panda-wiki/ui/metrics')),
    config: lazy(() => import('./components/config/MetricsConfig')),
    fixed: false,
    disabled: false,
  },
};

export const TYPE_TO_CONFIG_LABEL = {
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
