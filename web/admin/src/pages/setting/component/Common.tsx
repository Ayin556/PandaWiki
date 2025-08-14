import { Button, Stack, styled, Tooltip } from '@mui/material';
import Card from '@/components/Card';
import InfoIcon from '@mui/icons-material/Info';

const StyledFormLabelWrapper = styled('div')<{ vertical?: boolean }>(
  ({ vertical, theme }) => ({
    width: vertical ? '100%' : 156,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    marginBottom: vertical ? theme.spacing(1) : 0,
  }),
);

const StyledFormLabel = styled('span')<{ required?: boolean }>(
  ({ theme, required }) => ({
    position: 'relative',
    fontSize: 14,
    '&::before': required && {
      content: '"*"',
      fontSize: 16,
      display: 'inline-block',
      position: 'absolute',
      right: -8,
      top: -2,
      color: theme.palette.error.main,
    },
  }),
);

export const StyledFormItem = styled('div')<{ vertical?: boolean }>(
  ({ theme, vertical }) => ({
    display: 'flex',
    alignItems: vertical ? 'flex-start' : 'center',
    flexDirection: vertical ? 'column' : 'row',
    gap: vertical ? 0 : theme.spacing(2),
  }),
);

export const FormItem = ({
  label,
  children,
  required,
  vertical = false,
  tooltip,
  extra,
}: {
  label?: string | React.ReactNode;
  children?: React.ReactNode;
  required?: boolean;
  vertical?: boolean;
  tooltip?: React.ReactNode;
  extra?: React.ReactNode;
}) => {
  return (
    <StyledFormItem vertical={vertical}>
      <StyledFormLabelWrapper vertical={vertical}>
        <Stack direction='row' alignItems='center' flex={1}>
          <StyledFormLabel required={required}>{label}</StyledFormLabel>
          {tooltip && typeof tooltip === 'string' ? (
            <Tooltip title={tooltip} placement='top' arrow>
              <InfoIcon sx={{ color: 'text.secondary', fontSize: 14, ml: 1 }} />
            </Tooltip>
          ) : (
            tooltip
          )}
        </Stack>

        {extra}
      </StyledFormLabelWrapper>
      {children}
    </StyledFormItem>
  );
};

const StyleSettingCardTitle = styled('div')(({ theme }) => ({
  fontWeight: 'bold',
  padding: theme.spacing(2, 1.5),
  backgroundColor: theme.palette.background.paper2,
}));

export const SettingCard = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  return (
    <Card sx={{ pb: 2 }}>
      <StyleSettingCardTitle>{title}</StyleSettingCardTitle>
      {children}
    </Card>
  );
};

const StyledSettingCardItem = styled('div')(({ theme }) => ({
  '&:not(:last-child)': {
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(2),
  },
}));

const StyledSettingCardItemTitleWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: theme.spacing(2),
  height: 32,
  fontWeight: 'bold',
}));

const StyledSettingCardItemTitle = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  '&::before': {
    content: '""',
    display: 'inline-block',
    width: 4,
    height: 12,
    backgroundColor: theme.palette.common.black,
    borderRadius: '2px',
    marginRight: theme.spacing(1),
  },
}));

const StyledSettingCardItemContent = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  padding: theme.spacing(0, 2),
}));

const StyledSettingCardItemTitleMore = styled('a')(({ theme }) => ({
  marginLeft: theme.spacing(1),
  fontSize: 14,
  textDecoration: 'none',
  fontWeight: 'normal',
  '&:hover': {
    fontWeight: 'bold',
  },
}));

type SettingCardItemMore =
  | React.ReactNode
  | {
      type: 'link';
      href: string;
      target?: string;
      text?: string;
    };

export const SettingCardItem = ({
  children,
  title,
  isEdit,
  onSubmit,
  extra,
  more,
}: {
  children?: React.ReactNode;
  title?: React.ReactNode;
  isEdit?: boolean;
  onSubmit?: () => void;
  extra?: React.ReactNode;
  more?: SettingCardItemMore;
}) => {
  const renderMore = (more: SettingCardItemMore) => {
    if (more && typeof more === 'object' && 'type' in more) {
      const linkMore = more as {
        type: 'link';
        href: string;
        target?: string;
        text?: string;
      };
      if (linkMore.type === 'link') {
        // 处理链接类型
        return (
          <StyledSettingCardItemTitleMore
            href={linkMore.href}
            target={linkMore.target}
          >
            {linkMore.text ?? '更多'}
          </StyledSettingCardItemTitleMore>
        );
      }
      return more as React.ReactNode;
    } else {
      return more;
    }
  };
  return (
    <StyledSettingCardItem>
      <StyledSettingCardItemTitleWrapper>
        <StyledSettingCardItemTitle>
          {title} {renderMore(more)}
        </StyledSettingCardItemTitle>
        {isEdit && (
          <Button variant='contained' size='small' onClick={onSubmit}>
            保存
          </Button>
        )}
        {extra}
      </StyledSettingCardItemTitleWrapper>
      <StyledSettingCardItemContent>{children}</StyledSettingCardItemContent>
    </StyledSettingCardItem>
  );
};
