import Emoji from '@/components/emoji';
import { postShareProV1ContributeSubmit } from '@/request/pro/ShareContribute';
import { Box, TextField } from '@mui/material';
import { message, Modal } from '@ctzhian/ui';
import { Controller, useForm } from 'react-hook-form';

interface AddNodeModalProps {
  open: boolean;
  onCancel: () => void;
}
const AddNodeModal = ({ open, onCancel }: AddNodeModalProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ name: string; emoji: string }>({
    defaultValues: {
      name: '',
      emoji: '',
    },
  });

  const handleClose = () => {
    reset();
    onCancel();
  };

  const submit = (value: { name: string; emoji: string }) => {
    postShareProV1ContributeSubmit({
      name: value.name,
      content: '',
      reason: '',
      type: 'add',
    }).then(({ id }) => {
      message.success('创建成功');
      reset();
      handleClose();
      window.open(`/doc/editor/${id}`, '_blank');
    });
  };

  return (
    <Modal
      title='创建文档'
      open={open}
      width={600}
      okText='创建'
      onCancel={handleClose}
      onOk={handleSubmit(submit)}
    >
      <Box sx={{ fontSize: 14, lineHeight: '36px' }}>文档名称</Box>
      <Controller
        control={control}
        name='name'
        rules={{ required: `请输入文档名称` }}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            autoFocus
            size='small'
            placeholder={`请输入文档名称`}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        )}
      />
      <Box sx={{ fontSize: 14, lineHeight: '36px', mt: 1 }}>文档图标</Box>
      <Controller
        control={control}
        name='emoji'
        render={({ field }) => <Emoji {...field} type={2} />}
      />
    </Modal>
  );
};

export default AddNodeModal;
