import {
  Box,
  IconButton,
  MenuItem,
  Popover,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { v4 as uuidv4 } from 'uuid';
import { Icon } from '@ctzhian/ui';
import { Dispatch, SetStateAction, useMemo, useState, lazy } from 'react';
import type { CSSProperties } from 'react';
import { Component } from '../../index';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppDispatch, useAppSelector } from '@/store';
import { setAppPreviewData } from '@/store/slices/config';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import {
  IconMuluwendang,
  IconJichuwendang,
  IconJianyiwendang,
  IconChangjianwenti,
  IconLunbotu,
  IconShanchu,
} from '@panda-wiki/icons';
import { DEFAULT_DATA, TYPE_TO_CONFIG_LABEL } from '../../constants';
interface ComponentBarProps {
  components: Component[];
  setComponents: Dispatch<SetStateAction<Component[]>>;
  curComponent: Component;
  setCurComponent: Dispatch<SetStateAction<Component>>;
  setIsEdit: Dispatch<SetStateAction<boolean>>;
}
const ComponentBar = ({
  components,
  setComponents,
  curComponent,
  setCurComponent,
  setIsEdit,
}: ComponentBarProps) => {
  const dispatch = useAppDispatch();
  const appPreviewData = useAppSelector(state => state.config.appPreviewData);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const popoverOpen = Boolean(anchorEl);
  const options = useMemo(
    () => [
      {
        name: 'basic_doc',
        title: '基础文档',
        icon: IconJichuwendang,
        component: lazy(() => import('@panda-wiki/ui/basicDoc')),
        config: lazy(() => import('../config/BasicDocConfig')),
      },
      {
        name: 'dir_doc',
        title: '目录文档',
        icon: IconMuluwendang,
        component: lazy(() => import('@panda-wiki/ui/dirDoc')),
        config: lazy(() => import('../config/DirDocConfig')),
      },
      {
        name: 'simple_doc',
        title: '简易文档',
        icon: IconJianyiwendang,
        component: lazy(() => import('@panda-wiki/ui/simpleDoc')),
        config: lazy(() => import('../config/SimpleDocConfig')),
      },
      {
        name: 'carousel',
        title: '轮播图展示',
        icon: IconLunbotu,
        component: lazy(() => import('@panda-wiki/ui/carousel')),
        config: lazy(() => import('../config/CarouselConfig')),
      },
      {
        name: 'faq',
        title: '常见问题',
        icon: IconChangjianwenti,
        component: lazy(() => import('@panda-wiki/ui/faq')),
        config: lazy(() => import('../config/FaqConfig')),
      },
      // {
      //   name: 'contact',
      //   title: '联系我们',
      //   component: lazy(() => import('@panda-wiki/ui/faq')),
      //   config: lazy(() => import('../config/FaqConfig')),
      // },
    ],
    [],
  );
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const nonFixedIds = useMemo(
    () => components.filter(c => !c.fixed).map(c => c.id),
    [components],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    // 仅对非 fixed 项进行重排，fixed 保持原位置
    const nonFixedItems = components.filter(c => !c.fixed);
    const fromIdx = nonFixedItems.findIndex(c => c.id === active.id);
    const toIdx = nonFixedItems.findIndex(c => c.id === over.id);
    if (fromIdx === -1 || toIdx === -1) return;

    const newNonFixed = arrayMove(nonFixedItems, fromIdx, toIdx);

    const result: Component[] = [];
    let cursor = 0;
    for (let i = 0; i < components.length; i++) {
      const cur = components[i];
      if (cur.fixed) {
        result.push(cur);
      } else {
        result.push(newNonFixed[cursor]);
        cursor += 1;
      }
    }
    setComponents(result);
    setIsEdit(true);
  };

  const SortableItem = ({ item }: { item: Component }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id, disabled: !!item.fixed });
    const style: CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.6 : 1,
      cursor: isDragging ? 'move' : 'pointer',
    };
    return (
      <Stack
        ref={setNodeRef}
        direction={'row'}
        sx={{
          height: '40px',
          borderRadius: '6px',
          bgcolor: item.id === curComponent.id ? '#F2F8FF' : '',
          pl: '12px',
          alignItems: 'center',
          mb: '10px',
          transition: 'all .15s ease',
          '&:hover': {
            '.icon-shanchu': {
              display: item.fixed ? 'none' : 'block',
            },
          },
        }}
        style={style}
        key={item.id}
        onClick={() => {
          setCurComponent(item);
        }}
        {...(!item.fixed ? { ...attributes, ...listeners } : {})}
      >
        <Icon
          type='icon-wangyeguajian'
          sx={{
            color: item.id === curComponent.id ? '#5F58FE' : '#21222D',
            fontSize: '14px',
          }}
        ></Icon>
        <Typography
          sx={{
            marginLeft: '8px',
            fontSize: '14px',
            color: item.id === curComponent.id ? '#5F58FE' : '#344054',
            fontWeight: 500,
          }}
        >
          {item.title}
        </Typography>
        <IconShanchu
          className='icon-shanchu'
          sx={{ fontSize: '14px', ml: 'auto', mr: 1, display: 'none' }}
          onClick={e => {
            e.stopPropagation();
            if (item.fixed) return;
            const filterComponents = components.filter(c => c.id !== item.id);
            if (curComponent.id === item.id) {
              setCurComponent(filterComponents[0]);
            }
            setComponents(filterComponents);
            setIsEdit(true);
          }}
        />
      </Stack>
    );
  };

  return (
    <Stack
      sx={{
        width: '20px',
        minWidth: '200px',
        bgcolor: '#FFFFFF',
        borderRight: '1px solid #ECEEF1',
        height: '100%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
      direction={'column'}
    >
      {appPreviewData && (
        <>
          <Stack
            direction={'row'}
            sx={{
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingX: '20px',
              paddingTop: '19px',
            }}
          >
            <Typography
              sx={{
                fontSize: '16px',
                lineHeight: '30px',
                fontWeight: 600,
              }}
            >
              配色方案
            </Typography>
          </Stack>
          <Stack sx={{ paddingX: '20px', marginTop: '15px' }}>
            <Select
              value={appPreviewData.settings?.theme_mode}
              sx={{
                width: '100%',
                height: '40px',
                bgcolor: '#F2F8FF',
                border: '1px solid #5F58FE',
                color: '#5F58FE',
                '&:focus': {
                  border: '1px solid #5F58FE',
                },
                '&:hover': {
                  border: '1px solid #5F58FE',
                },
                '&.Mui-focused': {
                  border: '1px solid #5F58FE',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
              onChange={e => {
                if (!appPreviewData) return;
                const newInfo = {
                  ...appPreviewData,
                  settings: {
                    ...appPreviewData.settings,
                    theme_mode: e.target.value,
                  },
                };
                setIsEdit(true);
                dispatch(setAppPreviewData(newInfo));
              }}
            >
              <MenuItem value='light'>浅色模式</MenuItem>
              <MenuItem value='dark'>深色模式</MenuItem>
            </Select>
          </Stack>
        </>
      )}

      <Stack
        direction={'row'}
        sx={{
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingX: '20px',
          paddingTop: '19px',
        }}
      >
        <Typography
          sx={{
            fontSize: '16px',
            lineHeight: '30px',
            fontWeight: 600,
          }}
        >
          组件
        </Typography>
        <IconButton
          size='small'
          onClick={e => {
            setAnchorEl(e.currentTarget);
          }}
        >
          <AddCircleRoundedIcon
            sx={{ fontSize: '16px', color: 'primary.main' }}
          />
        </IconButton>
      </Stack>
      <Popover
        open={popoverOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: {
              p: '12px',
              width: '200px',
            },
          },
        }}
      >
        <Stack
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          {options.map(item => (
            <Stack
              key={item.name}
              direction={'column'}
              alignItems={'center'}
              gap={1}
              sx={{
                cursor: 'pointer',
                transition: 'all .15s ease',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
              onClick={() => {
                const addComponent = {
                  id: uuidv4(),
                  name: item.name,
                  title: item.title,
                  component: item.component,
                  config: item.config,
                  fixed: false,
                };
                // if (components.find(c => c.name === item.name)) return;
                const newInfo = {
                  ...appPreviewData,
                  settings: {
                    ...(appPreviewData?.settings || {}),
                    web_app_landing_configs: [
                      ...(appPreviewData?.settings?.web_app_landing_configs ||
                        []),
                      {
                        type: item.name,
                        id: addComponent.id,
                        ...DEFAULT_DATA[item.name as keyof typeof DEFAULT_DATA],
                      },
                    ],
                  },
                };
                dispatch(setAppPreviewData(newInfo));
                setCurComponent(addComponent);
                setAnchorEl(null);
                setComponents([
                  ...components.slice(0, -1),
                  addComponent,
                  ...components.slice(-1),
                ]);
                setIsEdit(true);
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  width: '60px',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: '60px',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: '#F8FAFF',
                  },
                }}
              >
                <item.icon sx={{ fontSize: '24px' }} />
              </Box>
              <Typography sx={{ fontSize: '12px' }}>{item.title}</Typography>
            </Stack>
          ))}
        </Stack>
      </Popover>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={nonFixedIds}
          strategy={verticalListSortingStrategy}
        >
          <Stack
            direction={'column'}
            sx={{
              marginTop: '15px',
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              paddingX: '20px',
              paddingBottom: '20px',
            }}
          >
            {components.map(item => (
              <SortableItem key={item.id} item={item} />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>
    </Stack>
  );
};

export default ComponentBar;
