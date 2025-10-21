import Emoji from '@/components/Emoji';
import { DomainCreateNodeReq, V1NodeDetailResp } from '@/request';
import { postApiV1Node, putApiV1NodeDetail } from '@/request/Node';
import { useAppSelector } from '@/store';
import { message, Modal } from '@ctzhian/ui';
import { Box, TextField } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

interface DocAddByCustomTextProps {
  open: boolean;
  data?: V1NodeDetailResp;
  autoJump?: boolean;
  onClose: () => void;
  parentId?: string;
  setDetail?: (data: V1NodeDetailResp) => void;
  refresh?: () => void;
  type?: 1 | 2;
  onCreated?: (node: {
    id: string;
    name: string;
    type: 1 | 2;
    emoji?: string;
  }) => void;
}
const DocAddByCustomText = ({
  open,
  data,
  autoJump = true,
  parentId,
  onClose,
  refresh,
  setDetail,
  type = 2,
  onCreated,
}: DocAddByCustomTextProps) => {
  const { kb_id: id } = useAppSelector(state => state.config);
  const text = type === 1 ? '文件夹' : '文档';

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
    onClose();
  };

  const submit = (value: { name: string; emoji: string }) => {
    if (data) {
      putApiV1NodeDetail({
        id: data.id || '',
        kb_id: id,
        name: value.name,
        emoji: value.emoji,
      }).then(() => {
        message.success('修改成功');
        reset();
        handleClose();
        refresh?.();
        setDetail?.({
          name: value.name,
          meta: { ...data.meta, emoji: value.emoji },
          status: 1,
        });
      });
    } else {
      if (!id) return;
      const params: DomainCreateNodeReq = {
        name: value.name,
        content: '',
        kb_id: id,
        type,
        emoji: value.emoji,
      };
      if (parentId) {
        params.parent_id = parentId;
      }
      postApiV1Node(params).then(({ id }) => {
        message.success('创建成功');
        reset();
        handleClose();
        // 回传创建结果给上层，由上层本地追加并滚动
        onCreated?.({ id, name: value.name, type, emoji: value.emoji });
        if (type === 2 && autoJump) {
          window.open(`/doc/editor/${id}`, '_blank');
        }
      });
    }
  };

  useEffect(() => {
    if (data) {
      reset({
        name: data.name || '',
        emoji: data.meta?.emoji || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Modal
      title={data ? `编辑${text}` : `创建${text}`}
      open={open}
      width={600}
      okText={data ? '保存' : '创建'}
      onCancel={handleClose}
      onOk={handleSubmit(submit)}
    >
      <Box sx={{ fontSize: 14, lineHeight: '36px' }}>{text}名称</Box>
      <Controller
        control={control}
        name='name'
        rules={{ required: `请输入${text}名称` }}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            autoFocus
            size='small'
            placeholder={`请输入${text}名称`}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
        )}
      />
      <Box sx={{ fontSize: 14, lineHeight: '36px', mt: 1 }}>{text}图标</Box>
      <Controller
        control={control}
        name='emoji'
        render={({ field }) => <Emoji {...field} type={type} />}
      />
    </Modal>
  );
};

export default DocAddByCustomText;
