import { CSSProperties, memo, useRef, useCallback } from 'react';
import { styled, alpha } from '@mui/material';
import { StyledTopicTitle } from '../component/styledCommon';
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

const StyledSwiperSlideTitle = styled('h3')(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: 20,
  fontWeight: 600,
}));

const StyledSwiperSlideDesc = styled('h3')(({ theme }) => ({
  color: alpha(theme.palette.text.primary, 0.5),
  fontSize: 14,
  fontWeight: 400,
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
    <StyledCarousel
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
      <StyledCarouselInner>
        <StyledTopicTitle ref={titleRef} sx={{ color: 'text.primary' }}>
          {title}
        </StyledTopicTitle>
        <Swiper
          onSwiper={swiper => {
            swiperRef.current = swiper;
          }}
          onClick={handleSlideClick}
          slidesPerView={mobile ? 1 : 2}
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
              <StyledSwiperSlideTitle>{item.title}</StyledSwiperSlideTitle>
              <StyledSwiperSlideDesc>{item.desc}</StyledSwiperSlideDesc>
            </SwiperSlide>
          ))}
        </Swiper>
      </StyledCarouselInner>
    </StyledCarousel>
  );
};

export default memo(Carousel);
