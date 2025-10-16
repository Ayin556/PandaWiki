import { formatByte } from '@/utils';
import { Ellipsis, Icon } from '@ctzhian/ui';
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Stack,
  alpha,
  useTheme,
} from '@mui/material';

type DataItem = {
  id: string;
  uuid: string;
  title: string;
  file?: File;
  content?: string;
  progress?: number;
  type: 'file' | 'other' | 'folder';
  space_id?: string;
  file_type?: string;
  open?: boolean;
  status:
    | 'default'
    | 'waiting'
    | 'uploading'
    | 'upload-done'
    | 'upload-error'
    | 'pulling'
    | 'pull-done'
    | 'pull-error'
    | 'creating'
    | 'success'
    | 'error';
};

interface DocumentItemProps {
  item: DataItem;
  index: number;
  depth?: number;
  checked: boolean;
  isUploadFileType: boolean;
  onToggleSelect: (item: DataItem) => void;
  onUpload?: (item: DataItem) => void;
  onScrapeUrl?: (item: DataItem) => void;
  onPullData?: (item: DataItem) => void;
  onCreateDoc?: (item: DataItem) => void;
  onRemove?: (index: number) => void;
  onFolderPullData?: (item: DataItem) => void;
  onFolderOpen?: (item: DataItem) => void;
  onAbort?: (item: DataItem) => void;
  hasChildren?: boolean;
  isRunning?: boolean;
}

const DocumentItem = ({
  item,
  index,
  depth = 0,
  checked,
  isUploadFileType,
  onToggleSelect,
  onUpload,
  onScrapeUrl,
  onPullData,
  onCreateDoc,
  onRemove,
  onFolderPullData,
  onFolderOpen,
  onAbort,
  hasChildren = false,
  isRunning = false,
}: DocumentItemProps) => {
  const theme = useTheme();

  // 判断是否可以中断
  const canAbort = ['uploading', 'pulling', 'creating'].includes(item.status);

  const renderStatusIndicator = () => {
    // if (item.status === 'success') {
    //   return (
    //     <Stack
    //       direction='row'
    //       justifyContent='center'
    //       alignItems='center'
    //       sx={{ flexShrink: 0, width: 40, height: 40 }}
    //     >
    //       <Icon
    //         type='icon-duihao'
    //         sx={{ fontSize: 18, color: 'success.main' }}
    //       />
    //     </Stack>
    //   );
    // }

    // if (['error', 'pull-error', 'upload-error'].includes(item.status)) {
    //   return (
    //     <Stack
    //       direction='row'
    //       justifyContent='center'
    //       alignItems='center'
    //       sx={{ flexShrink: 0, width: 40, height: 40 }}
    //     >
    //       <Icon
    //         type='icon-icon_tool_close'
    //         sx={{ fontSize: 18, color: 'error.main' }}
    //       />
    //     </Stack>
    //   );
    // }

    return (
      <Checkbox
        edge='start'
        size='small'
        checked={checked}
        tabIndex={-1}
        disableRipple
        sx={{ ml: '10px' }}
        inputProps={{ 'aria-labelledby': item.uuid }}
      />
    );
  };

  const renderActions = () => {
    if (item.status === 'success') return null;

    return (
      <Stack
        direction='row'
        gap={0}
        alignItems='center'
        sx={{ position: 'relative ' }}
      >
        {/* 文件夹操作 */}
        {item.type === 'folder' &&
          (!hasChildren ? (
            <Button
              size='small'
              color='primary'
              loading={item.status === 'uploading'}
              sx={{ px: 1, py: 0.5, minWidth: 0 }}
              onClick={() => onFolderPullData?.(item)}
            >
              拉取文档
            </Button>
          ) : (
            <IconButton
              size='small'
              sx={{
                position: 'absolute',
                right: 0,
                transform: item.open ? 'rotate(-180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease',
              }}
              onClick={() => onFolderOpen?.(item)}
            >
              <Icon type='icon-xiajiantou' />
            </IconButton>
          ))}

        {/* 文件/其他类型操作 */}
        {item.type !== 'folder' && (
          <>
            {/* 上传进度 + 中断按钮 */}
            {item.status === 'uploading' && (
              <Stack direction='row' alignItems='center' gap={1}>
                <CircularProgress size={13} />
                {isUploadFileType && item.progress !== undefined ? (
                  <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                    {item.progress}%
                  </Box>
                ) : (
                  <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                    数据拉取中
                  </Box>
                )}
                {onAbort && (
                  <Button
                    size='small'
                    color='error'
                    sx={{ px: 1, py: 0.5, minWidth: 0, ml: 1 }}
                    onClick={() => onAbort(item)}
                  >
                    中断
                  </Button>
                )}
              </Stack>
            )}

            {/* 拉取进度 + 中断按钮 */}
            {item.status === 'pulling' && (
              <Stack direction='row' alignItems='center' gap={1}>
                <CircularProgress size={13} />
                {item.progress && item.progress > 0 && item.progress < 100 ? (
                  <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                    {item.progress}%
                  </Box>
                ) : (
                  <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                    数据拉取中
                  </Box>
                )}
                {onAbort && (
                  <Button
                    size='small'
                    color='error'
                    sx={{ px: 1, py: 0.5, minWidth: 0, ml: 1 }}
                    onClick={() => onAbort(item)}
                  >
                    中断
                  </Button>
                )}
              </Stack>
            )}

            {/* 创建进度 + 中断按钮 */}
            {item.status === 'creating' && (
              <Stack direction='row' alignItems='center' gap={1}>
                <CircularProgress size={13} />
                <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
                  文档创建中
                </Box>
                {onAbort && (
                  <Button
                    size='small'
                    color='error'
                    sx={{ px: 1, py: 0.5, minWidth: 0, ml: 1 }}
                    onClick={() => onAbort(item)}
                  >
                    中断
                  </Button>
                )}
              </Stack>
            )}

            {/* 文件类型操作按钮 */}
            {item.type === 'file' && (
              <>
                {item.status === 'default' && (
                  <Button
                    size='small'
                    color='primary'
                    sx={{ px: 1, py: 0.5, minWidth: 0 }}
                    onClick={() => onUpload?.(item)}
                  >
                    导入
                  </Button>
                )}
                {item.status === 'upload-error' && (
                  <Button
                    size='small'
                    color='error'
                    sx={{ px: 1, py: 0.5, minWidth: 0 }}
                    onClick={() => onUpload?.(item)}
                  >
                    重新导入
                  </Button>
                )}
              </>
            )}

            {item.type !== 'file' && item.status === 'upload-error' && (
              <Button
                size='small'
                color='error'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={() => onScrapeUrl?.(item)}
              >
                重新导入
              </Button>
            )}

            {/* 拉取数据按钮 */}
            {item.status === 'upload-done' && (
              <Button
                size='small'
                color='primary'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={() => onPullData?.(item)}
              >
                拉取数据
              </Button>
            )}

            {item.status === 'pull-error' && (
              <Button
                size='small'
                color='error'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={() => onPullData?.(item)}
              >
                重新拉取数据
              </Button>
            )}

            {/* 创建文档按钮 */}
            {item.status === 'pull-done' && (
              <Button
                size='small'
                color='primary'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={() => onCreateDoc?.(item)}
              >
                创建文档
              </Button>
            )}

            {/* 重新创建文档按钮 */}
            {item.status === 'error' && (
              <Button
                size='small'
                color='error'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={() => onCreateDoc?.(item)}
              >
                重新创建文档
              </Button>
            )}

            {/* 删除按钮 - 仅在非进行中状态显示 */}
            {!canAbort && (
              <Button
                size='small'
                color='error'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={() => onRemove?.(index)}
              >
                删除
              </Button>
            )}
          </>
        )}
      </Stack>
    );
  };

  return (
    <ListItem
      sx={{
        p: 0,
        pl: depth * 4,
        position: 'relative',
        borderBottom: '1px dashed',
        borderColor: 'divider',
        '.MuiListItemButton-root': {
          pr: item.status === 'success' ? 2 : 20,
        },
        '&:last-child': {
          borderBottom: 'none',
        },
      }}
      secondaryAction={renderActions()}
    >
      {/* 进度条背景 */}
      {isUploadFileType &&
        ['uploading', 'pulling'].includes(item.status) &&
        item.progress !== undefined &&
        item.progress < 100 && (
          <Box
            sx={{
              width: `${item.progress}%`,
              transition: 'width 0.1s ease',
              height: '100%',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          />
        )}

      {item.status.includes('success') && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: alpha(theme.palette.success.main, 0.1),
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}

      {item.status.includes('error') && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: alpha(theme.palette.error.main, 0.05),
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      )}

      <ListItemButton
        role={undefined}
        onClick={() => onToggleSelect(item)}
        dense
        sx={{
          p: 0,
          ':hover': {
            bgcolor:
              item.status.includes('error') || item.status === 'success'
                ? 'transparent'
                : 'background.paper3',
          },
        }}
      >
        {item.type !== 'folder' ? (
          <ListItemIcon sx={{ minWidth: 'auto', width: 40, height: 40 }}>
            {renderStatusIndicator()}
          </ListItemIcon>
        ) : (
          <Box sx={{ height: 40, width: 10 }} />
        )}

        <ListItemText
          id={item.uuid}
          primary={
            item.type === 'folder' ? (
              <Stack direction='row' alignItems='center' gap='10px'>
                {item.title !== '飞书云盘' ? (
                  <Icon
                    type='icon-wenjianjia'
                    sx={{ fontSize: 14, flexShrink: 0, width: 20 }}
                  />
                ) : (
                  <Icon
                    type='icon-yunpan'
                    sx={{
                      fontSize: 20,
                      flexShrink: 0,
                      color: 'primary.main',
                    }}
                  />
                )}
                <Ellipsis sx={{ fontSize: 14 }}>{item.title}</Ellipsis>
              </Stack>
            ) : (
              <>
                {item.title || item.file?.name || (
                  <Skeleton variant='text' width={200} height={21} />
                )}
              </>
            )
          }
          secondary={
            item.content
              ? item.content
              : item.file
                ? formatByte(item.file.size)
                : ''
          }
          slotProps={{
            primary: {
              sx: {
                fontSize: 14,
                color: 'text.primary',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
            secondary: {
              sx: {
                fontSize: 12,
                color: 'text.disabled',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default DocumentItem;
