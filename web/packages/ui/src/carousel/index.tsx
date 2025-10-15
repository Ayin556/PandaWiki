import { CSSProperties, memo } from 'react';
import { styled } from '@mui/material';
import { StyledTopicTitle } from '../component/styledCommon';
import { Swiper, SwiperSlide } from 'swiper/react';

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
  padding: '100px 24px 40px',
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
  // @ts-ignore
  color: theme.palette.light.main,
  fontSize: 20,
  fontWeight: 600,
}));

const StyledSwiperSlideDesc = styled('h3')(({ theme }) => ({
  // @ts-ignore
  color: theme.palette.light.main,
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
  return (
    <StyledCarousel
      sx={{
        '.swiper-pagination-bullets': indicatorContainerStyle,
        '.swiper-pagination-bullet': indicatorIconButtonStyle,
        '.swiper-pagination-bullet-active': activeIndicatorIconButtonStyle,
      }}
    >
      <StyledCarouselInner sx={{ backgroundColor: bgColor }}>
        <StyledTopicTitle sx={{ color: titleColor }}>{title}</StyledTopicTitle>
        <Swiper
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
