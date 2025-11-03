import { CSSProperties, memo, useRef, useCallback, useState } from 'react';
import { styled, alpha, Tabs, Tab, Box } from '@mui/material';
import { StyledTopicTitle, StyledTopicBox } from '../component/styledCommon';
import { Swiper, SwiperSlide } from 'swiper/react';
import { useFadeInText } from '../hooks/useGsapAnimation';
import { Swiper as SwiperType } from 'swiper';

import 'swiper/css';
import 'swiper/css/pagination';

import { Pagination, Autoplay } from 'swiper/modules';
import './index.css';

interface CarouselProps {
  mobile?: boolean;
  title: string;
  bgColor?: string;
  titleColor?: string;
  items: {
    id: string;
    title: string;
    url: string;
    desc: string;
  }[];
}

export const indicatorContainerStyle: CSSProperties = {
  bottom: 0,
};

export const indicatorIconButtonStyle: CSSProperties = {
  width: 6,
  borderRadius: 2,
  background: 'rgba(255, 255, 255, 0.20)',
  height: 6,
  cursor: 'pointer',
  opacity: 1,
};

export const activeIndicatorIconButtonStyle: CSSProperties = {
  background: 'rgba(255, 255, 255, 1)',
};

const StyledCarousel = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(8),
  alignItems: 'center',
  padding: theme.spacing(0, 2),
}));

const StyledCarouselInner = styled('div')(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(8),
  flex: 1,
  padding: '120px 24px 100px',
  [theme.breakpoints.down('md')]: {
    padding: '50px 24px 20px',
  },
  maxWidth: 1740,
  borderRadius: '20px',
  width: '100%',
  height: '100%',
}));

const StyledSwiperSlideImg = styled('img')(({ theme }) => ({
  aspectRatio: '16 / 9',
  [theme.breakpoints.down('md')]: {
    width: 440,
  },
  [theme.breakpoints.up('md')]: {
    width: 880,
  },
  objectFit: 'cover',
  borderRadius: '10px',
}));

// 样式化的 Tabs 容器 - 浅灰色背景，圆角，阴影
const StyledTabsContainer = styled(Box)(({ theme }) => ({
  maxWidth: '100%',
  display: 'inline-flex',
  borderRadius: '10px',
  padding: theme.spacing(0.5),
  boxShadow: `0px 5px 20px 0px ${alpha(theme.palette.text.primary, 0.06)}`,
  border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
  gap: theme.spacing(0.5),
  marginBottom: '-20px',
}));

// 样式化的 Tabs 组件 - 移除默认样式
const StyledTabs = styled(Tabs)(({ theme }) => ({
  minHeight: 'auto',
  '& .MuiTabs-indicator': {
    display: 'none',
  },
  '& .MuiTabs-flexContainer': {
    gap: theme.spacing(0.5),
  },
}));

// 样式化的 Tab 组件 - 白色背景，圆角，深灰色文字
const StyledTab = styled(Tab)(({ theme }) => ({
  minHeight: 'auto',
  padding: theme.spacing(1, 2),
  borderRadius: '10px',
  backgroundColor: theme.palette.common.white,
  color: theme.palette.text.secondary,
  fontSize: 14,
  fontWeight: 400,
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
  },
  '&.Mui-selected': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontWeight: 500,
  },
}));

const Carousel = ({
  title,
  items,
  mobile,
  bgColor,
  titleColor,
}: CarouselProps) => {
  // 添加标题淡入动画
  const titleRef = useFadeInText(0.2, 0.1);
  // 添加Swiper ref
  const swiperRef = useRef<SwiperType | null>(null);
  const [activeTab, setActiveTab] = useState<string>(items[0]?.id || '');

  // 导航函数
  const handlePrev = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slidePrev();
    }
  }, []);

  const handleNext = useCallback(() => {
    if (swiperRef.current) {
      swiperRef.current.slideNext();
    }
  }, []);

  // 监听 Swiper 切换，更新 activeTab
  const handleSlideChange = useCallback(
    (swiper: SwiperType) => {
      const activeIndex = swiper.activeIndex;
      // 在 centeredSlides 模式下，activeIndex 直接对应 items 数组的索引
      const activeItem = items[activeIndex];
      if (activeItem) {
        setActiveTab(activeItem.id);
      }
    },
    [items],
  );

  // 当 activeTab 改变时，切换对应的 Swiper 卡片
  const handleTabChange = useCallback(
    (value: string) => {
      setActiveTab(value);
      const targetIndex = items.findIndex(item => item.id === value);
      if (targetIndex !== -1 && swiperRef.current) {
        swiperRef.current.slideTo(targetIndex);
      }
    },
    [items],
  );

  // 使用事件委托的方式处理点击事件
  const handleSlideClick = useCallback(
    (swiper: SwiperType, event: MouseEvent | TouchEvent | PointerEvent) => {
      const target = event.target as HTMLElement;
      // 查找最近的swiper-slide元素
      const slideElement = target.closest('.swiper-slide');

      if (slideElement) {
        // 检查是否包含swiper-slide-prev类名
        if (slideElement.classList.contains('swiper-slide-prev')) {
          handlePrev();
        }
        // 检查是否包含swiper-slide-next类名
        else if (slideElement.classList.contains('swiper-slide-next')) {
          handleNext();
        }
      }
    },
    [handlePrev, handleNext],
  );

  return (
    <StyledTopicBox
      sx={{
        '.swiper-pagination-bullets': indicatorContainerStyle,
        '.swiper-pagination-bullet': indicatorIconButtonStyle,
        '.swiper-pagination-bullet-active': activeIndicatorIconButtonStyle,
        '.swiper-slide-prev': {
          cursor: 'pointer',
        },
        '.swiper-slide-next': {
          cursor: 'pointer',
        },
      }}
    >
      <StyledTopicTitle ref={titleRef} sx={{ color: 'text.primary' }}>
        {title}
      </StyledTopicTitle>
      {items.length > 0 && (
        <StyledTabsContainer>
          <StyledTabs
            value={activeTab}
            onChange={(_, value) => {
              handleTabChange(value as string);
            }}
            variant='scrollable'
            scrollButtons={false}
          >
            {items.map(item => (
              <StyledTab key={item.id} label={item.title} value={item.id} />
            ))}
          </StyledTabs>
        </StyledTabsContainer>
      )}
      <Swiper
        onSwiper={swiper => {
          swiperRef.current = swiper;
        }}
        onSlideChange={handleSlideChange}
        onClick={handleSlideClick}
        spaceBetween={50}
        centeredSlides={true}
        pagination={{
          clickable: true,
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        modules={[Pagination, Autoplay]}
        className='mySwiper'
      >
        {items?.map(item => (
          <SwiperSlide key={item.id}>
            <StyledSwiperSlideImg src={item.url} alt={item.title} />
          </SwiperSlide>
        ))}
      </Swiper>
    </StyledTopicBox>
  );
};

export default memo(Carousel);
