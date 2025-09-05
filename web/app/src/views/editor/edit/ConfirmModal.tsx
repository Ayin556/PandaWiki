import React, { useEffect, useState } from 'react';
import { Modal } from '@ctzhian/ui';
import { Box, TextField, Typography, styled } from '@mui/material';
import { IconErrorCorrection } from '@/components/icons';

interface ConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onOk: (reason: string) => Promise<void>;
}

const StyledInfoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper2,
  borderRadius: theme.spacing(1.5),
  border: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(2),
}));

const StyledIconBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  flexShrink: 0,
}));

const StyledContentBox = styled(Box)(({ theme }) => ({
  flex: 1,
  '& .title': {
    fontSize: 16,
    fontWeight: 600,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
  },
  '& .description': {
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.secondary,
  },
}));

const StyledLabel = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 500,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
}));

const ConfirmModal = ({ open, onCancel, onOk }: ConfirmModalProps) => {
  const [reason, setReason] = useState('');

  useEffect(() => {
    setReason('');
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title='确认提交'
      okText='提交审核'
      onOk={() => onOk(reason)}
    >
      <StyledInfoBox>
        <StyledIconBox>
          <IconErrorCorrection sx={{ fontSize: 20 }} />
        </StyledIconBox>
        <StyledContentBox>
          <Typography className='title'>文档审核流程</Typography>
          <Typography className='description'>
            确认提交后，文档将进入审核状态。审核通过后将自动发布到知识库中，供其他用户查阅。
          </Typography>
        </StyledContentBox>
      </StyledInfoBox>

      <StyledLabel>备注信息（可选）</StyledLabel>
      <TextField
        fullWidth
        multiline
        rows={3}
        placeholder='请输入备注信息，帮助审核人员更好地理解您的修改...'
        value={reason}
        onChange={e => setReason(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
          },
        }}
      />
    </Modal>
  );
};

export default ConfirmModal;
