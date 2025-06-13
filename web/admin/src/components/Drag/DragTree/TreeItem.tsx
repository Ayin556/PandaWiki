import { createNode, ITreeItem, updateNode } from "@/api";
import Emoji from "@/components/Emoji";
import { AppContext, updateTree } from "@/constant/drag";
import DocAddByUrl from "@/pages/document/component/DocAddByUrl";
import DocDelete from "@/pages/document/component/DocDelete";
import { useAppSelector } from "@/store";
import { addOpacityToColor } from "@/utils";
import { Box, Button, Checkbox, IconButton, Stack, TextField, useTheme } from "@mui/material";
import { Ellipsis, Icon, MenuSelect, Message } from "ct-mui";
import dayjs from "dayjs";
import {
  SimpleTreeItemWrapper,
  TreeItemComponentProps
} from "dnd-kit-sortable-tree";
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import Summary from "./Summary";

const TreeItem = React.forwardRef<HTMLDivElement, TreeItemComponentProps<ITreeItem>>((props, ref) => {
  const theme = useTheme()
  const { kb_id: id } = useAppSelector(state => state.config)
  const { item, collapsed } = props;
  const context = useContext(AppContext);
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)

  const [urlOpen, setUrlOpen] = useState(false)
  const [key, setKey] = useState<'URL' | 'RSS' | 'Sitemap' | 'OfflineFile' | 'Notion'>('URL')

  if (!context) {
    throw new Error("TreeItem 必须在 AppContext.Provider 内部使用");
  }

  const { items, setItems, refresh, type, selected = [], onSelectChange, batchOpen } = context;

  const [value, setValue] = useState(item.name)
  const [emoji, setEmoji] = useState(item.emoji)
  const isEditting = item.isEditting ?? false;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(item.name)
    setEmoji(item.emoji)
  }, [item])

  useEffect(() => {
    if (isEditting && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditting]);

  const menuList = useMemo(() => [
    ...(item.type === 1 ? [
      {
        label: '创建文件夹',
        key: 'folder',
        onClick: () => {
          const temp = [...items];
          updateTree(temp, item.id, {
            ...item,
            children: [
              ...(item.children ?? []),
              {
                id: new Date().getTime().toString(),
                name: "",
                level: 2,
                type: 1,
                isEditting: true,
                parentId: item.id,
              }
            ]
          });
          setItems(temp);
        }
      },
      {
        label: '创建文档',
        key: 'doc',
        onClick: () => {
          const temp = [...items];
          updateTree(temp, item.id, {
            ...item,
            children: [
              ...(item.children ?? []),
              {
                id: `${items.length + 10}`,
                name: "",
                level: 2,
                type: 2,
                isEditting: true,
                parentId: item.id,
              }
            ]
          });
          setItems(temp);
        }
      },
      {
        label: '导入文档',
        key: 'third',
        children: [
          {
            label: '通过 URL 导入',
            key: 'URL',
            onClick: () => {
              setUrlOpen(true)
            }
          },
          {
            label: '通过 RSS 导入',
            key: 'RSS',
            onClick: () => {
              setKey('RSS')
              setUrlOpen(true)
            }
          },
          {
            label: '通过 Sitemap 导入',
            key: 'Sitemap',
            onClick: () => {
              setKey('Sitemap')
              setUrlOpen(true)
            }
          },
          {
            label: '通过离线文件导入',
            key: 'OfflineFile',
            onClick: () => {
              setKey('OfflineFile')
              setUrlOpen(true)
            }
          },
          {
            label: '通过 Notion 导入',
            key: 'Notion',
            onClick: () => {
              setKey('Notion')
              setUrlOpen(true)
            }
          }
        ]
      },
    ] : []),
    ...(item.type === 2 ? [
      {
        label: item.summary ? '查看摘要' : '生成摘要',
        key: 'summary',
        onClick: () => setSummaryOpen(true)
      }
    ] : []),
    ...(!isEditting ? [
      {
        label: '重命名',
        key: 'rename',
        onClick: () => {
          if (!isEditting) {
            const temp = [...items];
            updateTree(temp, item.id, {
              ...item,
              isEditting: true,
            });
            setItems(temp);
          }
        }
      }] : []),
    {
      label: '删除',
      key: 'delete',
      onClick: () => {
        setDeleteOpen(true)
      }
    }
  ], [item.type, isEditting, items])

  return <Box sx={{
    cursor: 'grab',
    pl: batchOpen ? 0 : 4,
    '&:active': {
      cursor: 'grabbing',
    },
    '&:hover': {
      bgcolor: 'background.paper2',
      borderRadius: '10px',
    },
    '&:has(.MuiInputBase-root)': {
      bgcolor: 'background.paper2',
      borderRadius: '10px',
    },
    '& .dnd-sortable-tree_simple_wrapper': {
      py: 1,
    },
    '& .dnd-sortable-tree_simple_ghost': {
      py: 1,
    },
    '& .dnd-sortable-tree_simple_tree-item-collapse_button': {
      position: 'absolute',
      left: -24,
      top: type === 'select' ? -4 : 0,
      height: 28,
      width: 20,
      cursor: 'pointer',
      background: `url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/PjwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+PHN2ZyB0PSIxNzQ3OTIwMDk2NzMxIiBjbGFzcz0iaWNvbiIgdmlld0JveD0iMCAwIDEwMjQgMTAyNCIgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHAtaWQ9IjM2MjciIGlkPSJteF9uXzE3NDc5MjAwOTY3MzMiIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPjxwYXRoIGQ9Ik0yNjcuMzM3MTQzIDM5Ni43MjY4NTdhMzguNTQ2Mjg2IDM4LjU0NjI4NiAwIDAgMSA1MS43MTItMi40ODY4NTdsMi43Nzk0MjggMi40ODY4NTcgMTkwLjY4MzQyOSAxOTAuNjgzNDI5IDE4OS40NC0xOTEuOTI2ODU3YTM4LjU0NjI4NiAzOC41NDYyODYgMCAwIDEgNTEuNzg1MTQzLTIuODUyNTcybDIuNzc5NDI4IDIuNDg2ODU3YzE0LjExNjU3MSAxMy44OTcxNDMgMTUuMzYgMzYuMzUyIDIuODUyNTcyIDUxLjc4NTE0M2wtMi40ODY4NTcgMi43MDYyODZMNTQwLjE2IDY2OS4yNTcxNDNhMzguNTQ2Mjg2IDM4LjU0NjI4NiAwIDAgMS01Mi4wNzc3MTQgMi41NmwtMi42MzMxNDMtMi40MTM3MTRMMjY3LjMzNzE0MyA0NTEuMjkxNDI5YTM4LjU0NjI4NiAzOC41NDYyODYgMCAwIDEgMC01NC41NjQ1NzJ6IiBwLWlkPSIzNjI4IiBmaWxsPSIjOGU4ZjhmIj48L3BhdGg+PC9zdmc+)`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
    },
    '& .dnd-sortable-tree_simple_wrapper:focus-visible': {
      outline: 'none',
    },
    '& .dnd-sortable-tree_simple_tree-item': {
      p: 0,
      gap: 2,
      border: 'none',
    },
    '& .dnd-sortable-tree_drag-handle': {
      cursor: 'grab',
      color: 'text.secondary',
      '&:hover': {
        color: 'primary.main',
      }
    },
    '& .dnd-sortable-tree_simple_tree-item-content': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      flex: 1,
    },
  }}>
    <Stack direction="row" alignItems={'center'} gap={2} onClick={(e) => e.stopPropagation()}>
      {(batchOpen || type === 'select') && <Checkbox
        sx={{ flexShrink: 0, color: 'text.disabled', width: '35px', height: '35px' }}
        checked={selected.includes(item.id)}
        onChange={(e) => {
          e.stopPropagation()
          onSelectChange?.(item.id)
        }}
      />}
      <Box sx={{ flex: 1 }}>
        <SimpleTreeItemWrapper
          {...props}
          ref={ref}
          indentationWidth={23}
          disableCollapseOnItemClick
          showDragHandle={false}
        >
          <Stack
            direction="row"
            alignItems={'center'}
            justifyContent="space-between"
            gap={2}
            flex={1}
            sx={{ pr: 2 }}
            onClick={() => {
              if (type === 'select') {
                onSelectChange?.(item.id)
                return
              }
              if (item.type === 2) window.open(`/doc/editor/${item.id}`, '_blank')
            }}
          >
            {item.isEditting ? <Stack direction="row" alignItems={'center'} gap={2}
              onClick={(e) => e.stopPropagation()}
            >
              <Emoji type={item.type} collapsed={collapsed} value={emoji} onChange={setEmoji} />
              <TextField
                size="small"
                value={value}
                inputRef={inputRef}
                placeholder="请输入文档名称"
                sx={{
                  width: 300,
                  input: {
                    bgcolor: 'background.paper'
                  }
                }}
                onChange={(e) => setValue(e.target.value)}
              />
              <Button variant="contained" size="small" onClick={(e) => {
                e.stopPropagation()
                if (item.name) {
                  updateNode({ id: item.id, kb_id: id, name: value, emoji }).then(() => {
                    Message.success('更新成功')
                    refresh?.()
                  })
                } else {
                  if (value === '') {
                    Message.error('文档名称不能为空')
                    return
                  }
                  createNode({ name: value, content: '', kb_id: id, parent_id: item.parentId, type: item.type, emoji }).then(() => {
                    Message.success('创建成功')
                    refresh?.()
                  })
                }
              }}>保存</Button>
              <Button variant="outlined" size="small" onClick={(e) => {
                e.stopPropagation()
                if (!item.name) {
                  const temp = [...items];
                  const removeItem = (items: ITreeItem[], id: string) => {
                    return items.filter(item => {
                      if (item.id === id) return false;
                      if (item.children) {
                        item.children = removeItem(item.children, id);
                      }
                      return true;
                    });
                  };
                  const newItems = removeItem(temp, item.id);
                  setItems(newItems);
                } else {
                  const temp = [...items];
                  updateTree(temp, item.id, {
                    ...item,
                    isEditting: false,
                  });
                  setItems(temp);
                }
              }}>取消</Button>
            </Stack> : <Stack direction="row" alignItems={'center'} gap={1} sx={{ fontSize: 14, cursor: 'pointer', ...(type === 'select' && { width: '100%', flex: 1 }) }}>
              <Box onClick={(e) => e.stopPropagation()} sx={{ flexShrink: 0, cursor: 'pointer' }}>
                <Emoji sx={{ width: 24, height: 24, fontSize: 14 }} type={item.type} collapsed={collapsed} value={item.emoji} onChange={async (value) => {
                  try {
                    await updateNode({ id: item.id, kb_id: id, emoji: value })
                    Message.success('更新成功')
                    const temp = [...items];
                    updateTree(temp, item.id, {
                      ...item,
                      emoji: value,
                    })
                    setItems(temp)
                  } catch (error) {
                    Message.error('更新失败')
                  }
                }} />
              </Box>
              {type === 'select' ? <Ellipsis sx={{ width: 0, flex: 1, overflow: 'hidden' }}>{item.name}</Ellipsis>
                : <Box>{item.name}</Box>}
            </Stack>}
            {type === 'move' && <Box sx={{ flex: 1, alignSelf: 'center', borderBottom: '1px dashed', borderColor: 'divider' }} />}
            {type === 'move' && <Stack direction="row" alignItems={'center'} gap={2} sx={{ flexShrink: 0 }}>
              <Box sx={{ fontSize: 12, fontFamily: 'monospace', color: 'text.auxiliary' }}>{dayjs(item.updated_at).fromNow()}</Box>
              <Box onClick={(e) => e.stopPropagation()}>
                <MenuSelect
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  childrenProps={{
                    anchorOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'right',
                    }
                  }}
                  list={menuList.map(value => ({
                    key: value.key,
                    children: value.children?.map(it => ({
                      key: it.key,
                      onClick: it.onClick,
                      label: <Box key={it.key}>
                        <Stack
                          direction={'row'}
                          alignItems={'center'}
                          gap={1}
                          sx={{
                            fontSize: 14, px: 2, lineHeight: '40px', height: 40, width: 180,
                            borderRadius: '5px',
                            cursor: 'pointer', ':hover': { bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1) }
                          }}
                        >
                          {it.label}
                        </Stack>
                      </Box>
                    })),
                    label: <Box key={value.key}>
                      <Stack
                        direction={'row'}
                        alignItems={'center'}
                        justifyContent={'space-between'}
                        gap={1}
                        sx={{
                          fontSize: 14, pl: 2, pr: 1, lineHeight: '40px', height: 40, width: 180,
                          borderRadius: '5px',
                          cursor: 'pointer', ':hover': { bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1) }
                        }}
                        onClick={value.onClick}
                      >
                        {value.label}
                        {value.children && <Icon type='icon-xiala' sx={{ fontSize: 20, transform: 'rotate(-90deg)' }} />}
                      </Stack>
                      {value.key === 'third' && <Box
                        sx={{
                          width: 145,
                          borderBottom: '1px dashed',
                          borderColor: theme.palette.divider,
                          my: 0.5,
                          mx: 'auto'
                        }} />}
                    </Box>
                  }))}
                  context={<IconButton size="small">
                    <Icon type='icon-gengduo' />
                  </IconButton>}
                />
              </Box>
            </Stack>}
          </Stack>
        </SimpleTreeItemWrapper>
      </Box>
    </Stack>
    <DocAddByUrl
      type={key}
      open={urlOpen}
      onCancel={() => setUrlOpen(false)}
      parentId={item.id}
      refresh={refresh}
    />
    <DocDelete
      open={deleteOpen}
      onClose={() => setDeleteOpen(false)}
      data={[{ id: item.id, name: item.name, type: item.type }]}
      refresh={refresh} />
    <Summary
      data={item}
      kb_id={id}
      open={summaryOpen}
      refresh={refresh}
      onClose={() => setSummaryOpen(false)}
    />
  </Box>
});

export default TreeItem
