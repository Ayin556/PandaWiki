import { ImportDocType } from '@/api';
import {
  alpha,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  useTheme,
} from '@mui/material';
import { DataItem } from '../types';

interface BatchActionBarProps {
  type: ImportDocType;
  checked: string[];
  data: DataItem[];
  isUploadFileType: boolean;
  totalCount: {
    loading: number;
    default: number;
    success: number;
    waiting: number;
    'upload-error': number;
    'upload-done': number;
    'pull-error': number;
    'pull-done': number;
    error: number;
    fail: number;
  };
  onToggleSelectAll: () => void;
  onBatchUpload?: () => void;
  onBatchScrape?: () => void;
  onBatchPullData?: () => void;
  onBatchCreateDoc?: () => void;
  onBatchDelete?: () => void;
  onBatchAbort?: () => void;
}

const BatchActionBar = ({
  type,
  checked,
  data,
  isUploadFileType,
  totalCount,
  onToggleSelectAll,
  onBatchUpload,
  onBatchScrape,
  onBatchPullData,
  onBatchCreateDoc,
  onBatchDelete,
  onBatchAbort,
}: BatchActionBarProps) => {
  const theme = useTheme();
  // 获取选中的数据项
  const checkedItems = data.filter(item => checked.includes(item.uuid));

  // 是否全选
  const isAllChecked = data.length > 0 && checked.length === data.length;

  // 检查选中项是否包含特定状态
  const hasUploadableItems = checkedItems.some(item =>
    ['default', 'upload-error'].includes(item.status),
  );

  const hasPullableItems = checkedItems.some(item =>
    ['upload-done', 'pull-error'].includes(item.status),
  );

  const hasCreatableItems = checkedItems.some(
    item => item.status === 'pull-done' || item.status === 'error',
  );

  const hasDeletableItems = checkedItems.some(
    item => item.status !== 'success',
  );

  const hasAbortableItems = checkedItems.some(item =>
    ['uploading', 'pulling', 'creating'].includes(item.status),
  );

  const hasProcessingItems = checkedItems.some(item =>
    ['uploading', 'pulling', 'creating'].includes(item.status),
  );

  return (
    <ListItem
      sx={{
        p: 0,
        borderBottom: '1px dashed',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        backgroundColor: 'background.default',
        '.MuiListItemButton-root': {
          pr: 20,
        },
      }}
      secondaryAction={
        checked.length > 0 && (
          <Stack direction='row' gap={0} alignItems='center'>
            {/* 批量导入按钮 */}
            {isUploadFileType && hasUploadableItems && (
              <Button
                size='small'
                color='primary'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={onBatchUpload}
              >
                批量导入
              </Button>
            )}

            {type === 'URL' && hasUploadableItems && (
              <Button
                size='small'
                color='primary'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={onBatchScrape}
              >
                批量导入
              </Button>
            )}

            {/* 批量拉取数据按钮 */}
            {hasPullableItems && (
              <Button
                size='small'
                color='primary'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={onBatchPullData}
              >
                批量拉取数据
              </Button>
            )}

            {/* 批量创建文档按钮 */}
            {hasCreatableItems && (
              <Button
                size='small'
                color='primary'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={onBatchCreateDoc}
              >
                批量创建文档
              </Button>
            )}

            {/* 批量中断按钮 */}
            {hasAbortableItems && onBatchAbort && (
              <Button
                size='small'
                color='error'
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                variant='text'
                onClick={onBatchAbort}
              >
                批量中断
              </Button>
            )}

            {/* 批量删除按钮 */}
            {hasDeletableItems && !hasAbortableItems && (
              <Button
                size='small'
                color='error'
                disabled={hasProcessingItems}
                sx={{ px: 1, py: 0.5, minWidth: 0 }}
                onClick={onBatchDelete}
              >
                批量删除
              </Button>
            )}
          </Stack>
        )
      }
    >
      <ListItemButton
        sx={{ p: 0 }}
        role={undefined}
        onClick={onToggleSelectAll}
        dense
      >
        <ListItemIcon sx={{ minWidth: 'auto', width: 40, height: 40 }}>
          <Checkbox
            edge='start'
            checked={isAllChecked}
            tabIndex={-1}
            disableRipple
            sx={{ ml: '10px' }}
            inputProps={{ 'aria-labelledby': 'checked-all' }}
          />
        </ListItemIcon>
        <ListItemText
          id='checked-all'
          primary={
            <Stack
              direction='row'
              alignItems='center'
              gap={1}
              sx={{
                color: 'warning.main',
                fontSize: 12,
                lineHeight: 1,
              }}
            >
              <Box sx={{ fontSize: 14, color: 'text.primary', mr: 1 }}>
                全选
              </Box>
              {totalCount.success > 0 && (
                <Box
                  sx={{
                    color: 'success.main',
                    fontWeight: 'bold',
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  创建：{totalCount.success}
                </Box>
              )}
              {totalCount.waiting > 0 && (
                <Tooltip
                  arrow
                  title={
                    <Stack>
                      {totalCount['upload-done'] > 0 && (
                        <Box>拉取数据：{totalCount['upload-done']}</Box>
                      )}
                      {totalCount['pull-done'] > 0 && (
                        <Box>创建文件：{totalCount['pull-done']}</Box>
                      )}
                      {totalCount['upload-error'] > 0 && (
                        <Box>
                          重新上传：
                          <Box
                            sx={{ color: 'error.main', fontWeight: 'bold' }}
                            component={'span'}
                          >
                            {totalCount['upload-error']}
                          </Box>
                        </Box>
                      )}
                      {totalCount['pull-error'] > 0 && (
                        <Box>
                          重新拉取：
                          <Box
                            sx={{ color: 'error.main', fontWeight: 'bold' }}
                            component={'span'}
                          >
                            {totalCount['pull-error']}
                          </Box>
                        </Box>
                      )}
                      {totalCount['error'] > 0 && (
                        <Box>
                          重新创建：
                          <Box
                            sx={{ color: 'error.main', fontWeight: 'bold' }}
                            component={'span'}
                          >
                            {totalCount['error']}
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  }
                >
                  <Box
                    sx={{
                      color: 'text.tertiary',
                      fontWeight: 'bold',
                      bgcolor:
                        totalCount.fail > 0
                          ? alpha(theme.palette.error.main, 0.1)
                          : 'background.paper3',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                    }}
                  >
                    等待处理：
                    {totalCount.fail > 0 && (
                      <>
                        <Box component='span' sx={{ color: 'error.main' }}>
                          {totalCount.fail}
                        </Box>
                        /
                      </>
                    )}
                    {totalCount.waiting}
                  </Box>
                </Tooltip>
              )}
              {totalCount.loading > 0 ? (
                <Stack
                  direction='row'
                  alignItems='flex-end'
                  gap={1}
                  sx={{
                    color: 'warning.main',
                    fontWeight: 'bold',
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                    px: 1,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  <CircularProgress color='warning' size={12} />
                  <Box>处理中：{totalCount.loading}</Box>
                </Stack>
              ) : null}
            </Stack>
          }
        />
      </ListItemButton>
    </ListItem>
  );
};

export default BatchActionBar;
