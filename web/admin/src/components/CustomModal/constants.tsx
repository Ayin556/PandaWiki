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
    title: '基础文档',
    bg_color: '#ffffff00',
    title_color: '#000000',
    nodes: [] as DomainRecommendNodeListResp[],
  },
  dir_doc: {
    title: '目录文档',
    bg_color: '#3248F2',
    title_color: '#ffffff',
    nodes: [] as DomainRecommendNodeListResp[],
  },
  simple_doc: {
    title: '简易文档',
    bg_color: '#ffffff00',
    title_color: '#000000',
    nodes: [] as DomainRecommendNodeListResp[],
  },
  carousel: {
    title: '轮播图展示',
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
    title: '常见问题',
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
    component: lazy(() => import('@panda-wiki/ui/header')),
    config: lazy(() => import('./components/config/HeaderConfig')),
    fixed: true,
  },
  banner: {
    name: 'banner',
    title: 'banner',
    component: lazy(() => import('@panda-wiki/ui/banner')),
    config: lazy(() => import('./components/config/BannerConfig')),
    fixed: true,
  },
  basic_doc: {
    name: 'basic_doc',
    title: '基础文档',
    icon: IconJichuwendang,
    component: lazy(() => import('@panda-wiki/ui/basicDoc')),
    config: lazy(() => import('./components/config/BasicDocConfig')),
    fixed: false,
  },
  dir_doc: {
    name: 'dir_doc',
    title: '目录文档',
    icon: IconMuluwendang,
    component: lazy(() => import('@panda-wiki/ui/dirDoc')),
    config: lazy(() => import('./components/config/DirDocConfig')),
    fixed: false,
  },
  simple_doc: {
    name: 'simple_doc',
    title: '简易文档',
    icon: IconJianyiwendang,
    component: lazy(() => import('@panda-wiki/ui/simpleDoc')),
    config: lazy(() => import('./components/config/SimpleDocConfig')),
    fixed: false,
  },
  carousel: {
    name: 'carousel',
    title: '轮播图展示',
    icon: IconLunbotu,
    component: lazy(() => import('@panda-wiki/ui/carousel')),
    config: lazy(() => import('./components/config/CarouselConfig')),
    fixed: false,
  },
  faq: {
    name: 'faq',
    title: '常见问题',
    icon: IconChangjianwenti,
    component: lazy(() => import('@panda-wiki/ui/faq')),
    config: lazy(() => import('./components/config/FaqConfig')),
    fixed: false,
  },
  footer: {
    name: 'footer',
    title: '底部导航',
    component: lazy(() => import('@panda-wiki/ui/footer')),
    config: lazy(() => import('./components/config/FooterConfig')),
    fixed: true,
  },
};

export const TYPE_TO_CONFIG_LABEL = {
  banner: 'banner_config',
  basic_doc: 'basic_doc_config',
  dir_doc: 'dir_doc_config',
  simple_doc: 'simple_doc_config',
  carousel: 'carousel_config',
  faq: 'faq_config',
} as const;
