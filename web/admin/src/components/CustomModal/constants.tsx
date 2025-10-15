import { lazy } from 'react';
import {
  IconMuluwendang,
  IconJichuwendang,
  IconJianyiwendang,
  IconChangjianwenti,
  IconLunbotu,
} from '@panda-wiki/icons';

export const DEFAULT_DATA = {
  banner: {
    title: 'PandaWiki AI 知识库',
    title_color: '#6E73FE',
    title_font_size: 60,
    subtitle:
      'PandaWiki 借助大模型的力量为你提供 AI 创作、 AI 问答、AI 搜索等能力',
    placeholder: '搜索文档',
    subtitle_color: '#ffffff80',
    subtitle_font_size: 16,
    bg_url: '',
    hot_search: [] as string[],
    btns: [
      {
        id: '1',
        text: '前往文档',
        type: 'contained',
        href: '',
      },
    ] as {
      id: string;
      text: string;
      type: 'contained' | 'outlined' | 'text';
      href: string;
    }[],
  },
  basicDoc: {
    title: '基础文档',
    bg_color: '#ffffff00',
    title_color: '#000000',
    docs: [],
  },
  dirDoc: {
    title: '目录文档',
    bg_color: '#3248F2',
    title_color: '#ffffff',
    dirs: [],
  },
  simpleDoc: {
    title: '简易文档',
    bg_color: '#ffffff00',
    title_color: '#000000',
    docs: [],
  },
  carousel: {
    title: '轮播图展示',
    bg_color: '#3248F2',
    title_color: '#ffffff',
    list: [],
  },
  faq: {
    title: '常见问题',
    bg_color: '#ffffff00',
    title_color: '#000000',
    list: [],
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
  basicDoc: {
    name: 'basicDoc',
    title: '基础文档',
    icon: IconJichuwendang,
    component: lazy(() => import('@panda-wiki/ui/basicDoc')),
    config: lazy(() => import('./components/config/BasicDocConfig')),
    fixed: false,
  },
  dirDoc: {
    name: 'dirDoc',
    title: '目录文档',
    icon: IconMuluwendang,
    component: lazy(() => import('@panda-wiki/ui/dirDoc')),
    config: lazy(() => import('./components/config/DirDocConfig')),
    fixed: false,
  },
  simpleDoc: {
    name: 'simpleDoc',
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
