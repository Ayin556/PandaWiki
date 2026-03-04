import Card from '@/components/Card';
import Cascader from '@/components/Cascader';
import EmptyState from '@/components/EmptyState';
import Loading from '@/components/Loading';
import { useURLSearchParams } from '@/hooks';
import { deleteApiV1NavDelete, postApiV1NavMove } from '@/request/Nav';
import type { V1NavListResp } from '@/request/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { setIsRefreshDocList, setNavId } from '@/store/slices/config';
import { addOpacityToColor } from '@/utils';
import { Ellipsis, message, Modal } from '@ctzhian/ui';
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box, Button, IconButton, Stack, useTheme } from '@mui/material';
import { IconDrag, IconGengduo, IconJiahao } from '@panda-wiki/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import NavEditModal from './NavEditModal';

const SortableNavItem = ({
  nav,
  selected,
  onSelect,
  onEdit,
  onDelete,
  showDelete,
  isLast,
}: {
  nav: V1NavListResp;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  showDelete: boolean;
  isLast: boolean;
}) => {
  const theme = useTheme();
  const id = nav.id || '';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const menuItems = [
    {
      key: 'edit',
      label: (
        <Stack
          direction='row'
          alignItems='center'
          sx={{
            fontSize: 14,
            px: 2,
            lineHeight: '40px',
            height: 40,
            width: 140,
            borderRadius: '5px',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
            },
          }}
        >
          修改目录
        </Stack>
      ),
      onClick: onEdit,
    },
    ...(showDelete
      ? [
          {
            key: 'delete',
            label: (
              <Stack
                direction='row'
                alignItems='center'
                sx={{
                  fontSize: 14,
                  px: 2,
                  lineHeight: '40px',
                  height: 40,
                  width: 140,
                  borderRadius: '5px',
                  cursor: 'pointer',
                  color: 'error.main',
                  '&:hover': {
                    bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                删除目录
              </Stack>
            ),
            onClick: onDelete,
          },
        ]
      : []),
  ];

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 2,
        cursor: 'pointer',
        ...(!isLast && {
          borderBottom: '1px dashed',
          borderColor: 'divider',
        }),
        '&:hover .nav-name': {
          color: 'primary.main',
        },
        opacity: isDragging ? 0.5 : 1,
      }}
      onClick={onSelect}
    >
      {selected && (
        <Box
          sx={{
            position: 'absolute',
            left: -2,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 4,
            height: 24,
            borderRadius: 1,
            bgcolor: 'primary.main',
          }}
        />
      )}
      <Box
        {...attributes}
        {...listeners}
        component='span'
        onClick={e => e.stopPropagation()}
        sx={{
          display: 'flex',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
        }}
      >
        <IconDrag sx={{ fontSize: 16 }} />
      </Box>
      <Ellipsis
        className='nav-name'
        sx={{
          flex: 1,
          width: 0,
          fontSize: 14,
          fontWeight: selected ? 600 : 400,
          color: selected ? 'primary.main' : 'text.primary',
        }}
      >
        {nav.name || '未命名'}
      </Ellipsis>
      <Box onClick={e => e.stopPropagation()} sx={{ display: 'inline-flex' }}>
        <Cascader
          list={menuItems}
          context={
            <IconButton size='small'>
              <IconGengduo sx={{ fontSize: 16 }} />
            </IconButton>
          }
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        />
      </Box>
    </Box>
  );
};

interface DocPageNavsProps {
  navList: V1NavListResp[];
  onNavListChange: React.Dispatch<React.SetStateAction<V1NavListResp[]>>;
  onNavDeleted?: (navId: string) => void;
  isSearching?: boolean;
  loading?: boolean;
}

const DocPageNavs = ({
  navList: navListProp,
  onNavListChange,
  onNavDeleted,
  isSearching = false,
  loading = false,
}: DocPageNavsProps) => {
  const dispatch = useAppDispatch();
  const { kb_id } = useAppSelector(state => state.config);
  const [searchParams, setSearchParams] = useURLSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editingNav, setEditingNav] = useState<V1NavListResp | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingNav, setDeletingNav] = useState<V1NavListResp | null>(null);
  const dataRef = useRef<V1NavListResp[]>([]);

  const navs = navListProp || [];
  const sortedNavs = [...navs].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 3 },
    }),
  );

  useEffect(() => {
    dataRef.current = sortedNavs;
  }, [sortedNavs]);

  // navList 变化后同步 selectedId，优先级：localStorage(nav_id_${kb_id}) > 第一个
  // 注意：sortedNavs 为空时不能调用 setNavId('')，因为初始加载时 navList 也为 []，会误删 localStorage
  useEffect(() => {
    const navIdFromStorage = kb_id
      ? localStorage.getItem(`nav_id_${kb_id}`)
      : null;
    const validInList = (id: string | null) =>
      id && sortedNavs.some(n => n.id === id);
    if (sortedNavs.length > 0) {
      const idToUse = validInList(navIdFromStorage)
        ? navIdFromStorage!
        : sortedNavs[0]?.id || null;
      if (idToUse) {
        setSelectedId(idToUse);
        dispatch(setNavId(idToUse));
      }
    } else {
      setSelectedId(null);
      // 不在此处 dispatch(setNavId(''))，否则初次挂载时 navList 未加载会误删 localStorage
      // 清空 nav_id 的场景由父组件 getData（接口返回空）或 handleDeleteConfirm（删除最后一项）处理
      const rest: Record<string, string> = {};
      searchParams.forEach((v, k) => {
        if (k !== 'nav_id') rest[k] = v;
      });
      setSearchParams(Object.keys(rest).length ? rest : null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kb_id, navListProp]);

  const handleSelect = useCallback(
    (id: string) => {
      setSelectedId(id);
      dispatch(setNavId(id));
    },
    [dispatch],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const current = dataRef.current;
      const oldIndex = current.findIndex(n => (n.id || '') === active.id);
      const newIndex = current.findIndex(n => (n.id || '') === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(current, oldIndex, newIndex);
      const next = reordered.map((item, index) => ({
        ...item,
        position: index,
      }));
      onNavListChange(next);
      const prevId = next[newIndex - 1]?.id;
      const nextId = next[newIndex + 1]?.id;
      postApiV1NavMove({
        id: active.id as string,
        kb_id,
        prev_id: prevId,
        next_id: nextId,
      }).then(() => {
        message.success('顺序已更新');
      });
    },
    [kb_id, onNavListChange],
  );

  const handleEdit = useCallback((nav: V1NavListResp) => {
    setEditingNav(nav);
    setEditOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setEditingNav(null);
    setEditOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditOpen(false);
    setEditingNav(null);
  }, []);

  const handleEditSuccess = useCallback(
    (updated?: { id: string; name: string }) => {
      if (updated) {
        onNavListChange(prev =>
          prev.map(n =>
            n.id === updated.id ? { ...n, name: updated.name } : n,
          ),
        );
      } else {
        dispatch(setIsRefreshDocList(true));
      }
      handleEditClose();
    },
    [onNavListChange, handleEditClose, dispatch],
  );

  const handleDeleteClick = useCallback((nav: V1NavListResp) => {
    setDeletingNav(nav);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDeleteConfirmClose = useCallback(() => {
    setDeleteConfirmOpen(false);
    setDeletingNav(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingNav) return;
    const nav = deletingNav;
    deleteApiV1NavDelete({ id: nav.id!, kb_id }).then(() => {
      message.success('删除成功');
      handleDeleteConfirmClose();
      const next = (navListProp || []).filter(n => n.id !== nav.id);
      onNavListChange(next);
      onNavDeleted?.(nav.id!);
      if (selectedId === nav.id && next.length > 0) {
        const first = next[0];
        if (first?.id) {
          setSelectedId(first.id);
          dispatch(setNavId(first.id));
        }
      } else if (next.length === 0) {
        setSelectedId(null);
        dispatch(setNavId(''));
        const rest: Record<string, string> = {};
        searchParams.forEach((v, k) => {
          if (k !== 'nav_id') rest[k] = v;
        });
        setSearchParams(Object.keys(rest).length ? rest : null);
      }
    });
  }, [
    deletingNav,
    kb_id,
    selectedId,
    navListProp,
    searchParams,
    setSearchParams,
    handleDeleteConfirmClose,
    onNavListChange,
    onNavDeleted,
    dispatch,
  ]);

  const showEmptySearch = isSearching && sortedNavs.length === 0;

  return (
    <>
      <Card sx={{ width: 220, minWidth: 220 }}>
        {loading ? (
          <Loading sx={{ py: 4 }} />
        ) : showEmptySearch ? (
          <EmptyState text='无搜索结果' sx={{ p: 4 }} />
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedNavs.map(n => n.id || '')}
                strategy={verticalListSortingStrategy}
              >
                <Stack>
                  {sortedNavs.map((nav, i) => (
                    <SortableNavItem
                      key={nav.id}
                      nav={nav}
                      selected={selectedId === nav.id}
                      onSelect={() => handleSelect(nav.id!)}
                      onEdit={() => handleEdit(nav)}
                      onDelete={() => handleDeleteClick(nav)}
                      showDelete={sortedNavs.length > 1}
                      isLast={i === sortedNavs.length - 1}
                    />
                  ))}
                </Stack>
              </SortableContext>
            </DndContext>
            {!isSearching && (
              <Box sx={{ p: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  fullWidth
                  variant='text'
                  startIcon={
                    <IconJiahao sx={{ fontSize: '10px !important' }} />
                  }
                  onClick={handleAdd}
                  sx={{
                    justifyContent: 'center',
                    textTransform: 'none',
                  }}
                >
                  添加目录
                </Button>
              </Box>
            )}
          </>
        )}
      </Card>
      <NavEditModal
        open={editOpen}
        onClose={handleEditClose}
        onSuccess={handleEditSuccess}
        nav={editingNav}
        kb_id={kb_id}
      />
      <Modal
        title={
          <Stack direction='row' alignItems='center' gap={1}>
            <ErrorOutlineIcon sx={{ color: 'warning.main' }} />
            确认删除目录？
          </Stack>
        }
        open={deleteConfirmOpen}
        width={480}
        okText='确认删除'
        okButtonProps={{ sx: { bgcolor: 'error.main' } }}
        onCancel={handleDeleteConfirmClose}
        onOk={handleDeleteConfirm}
      >
        <Box sx={{ fontSize: 14, lineHeight: 1.6, color: 'text.secondary' }}>
          <Box component='p' sx={{ m: 0, mb: 1 }}>
            删除目录「
            <Box component='span' sx={{ fontWeight: 600 }}>
              {deletingNav?.name || '未命名'}
            </Box>
            」后，将
            <Box component='span' sx={{ color: 'error.main', fontWeight: 600 }}>
              同步删除该目录下所有文档
            </Box>
            ，且
            <Box component='span' sx={{ color: 'error.main', fontWeight: 600 }}>
              不可恢复
            </Box>
            ，请谨慎操作。
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default DocPageNavs;
