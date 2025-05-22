import { createDoc, ITreeItem, NodeDetail, updateDoc } from "@/api";
import { AppContext, updateTree } from "@/constant/drag";
import DocDelete from "@/pages/document/component/DocDelete";
import { useAppSelector } from "@/store";
import { Box, Button, IconButton, Stack, TextField } from "@mui/material";
import { Icon, MenuSelect, Message } from "ct-mui";
import dayjs from "dayjs";
import {
  SimpleTreeItemWrapper,
  TreeItemComponentProps
} from "dnd-kit-sortable-tree";
import React, { useContext, useState } from "react";

const TreeItem = React.forwardRef<HTMLDivElement, TreeItemComponentProps<ITreeItem>>((props, ref) => {
  const { kb_id: id } = useAppSelector(state => state.config)
  const { item, collapsed } = props;
  const context = useContext(AppContext);
  const [deleteOpen, setDeleteOpen] = useState(false)

  if (!context) {
    throw new Error("TreeItem 必须在 AppContext.Provider 内部使用");
  }

  const { items, setItems, refresh } = context;
  const [value, setValue] = useState(item.name)
  const isEditting = item.isEditting ?? false;

  return <Box sx={{
    cursor: 'grab',
    pl: 4,
    '&:active': {
      cursor: 'grabbing',
    },
    '&:hover': {
      bgcolor: 'background.paper2',
      borderRadius: '10px',
    },
    '&:has(input)': {
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
    <Box onClick={(e) => e.stopPropagation()}>
      <SimpleTreeItemWrapper
        {...props}
        ref={ref}
        indentationWidth={31}
        disableCollapseOnItemClick
        showDragHandle={false}
      >
        <Stack
          direction="row"
          alignItems={'center'}
          justifyContent="space-between"
          gap={2}
          flex={1}
          onClick={() => {
            if (item.type === 2) window.open(`/doc/editor/${item.id}`, '_blank')
          }}
        >
          {item.isEditting ? <Stack direction="row" alignItems={'center'} gap={2}
            onClick={(e) => e.stopPropagation()}
          >
            <TextField
              size="small"
              value={value}
              autoFocus
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
                updateDoc({ id: item.id, name: value }).then(() => {
                  Message.success('更新成功')
                  refresh?.()
                })
              } else {
                if (value === '') {
                  Message.error('文档名称不能为空')
                  return
                }
                createDoc({ name: value, content: '', kb_id: id, parent_id: item.parentId, type: item.type }).then(() => {
                  Message.success('创建成功')
                  refresh?.()
                })
              }
            }}>保存</Button>
            <Button variant="outlined" size="small" onClick={(e) => {
              e.stopPropagation()
              const temp = [...items];
              updateTree(temp, item.id, {
                ...item,
                isEditting: false,
              });
              setItems(temp);
            }}>取消</Button>
          </Stack> : <Stack direction="row" alignItems={'center'} gap={2} sx={{ cursor: 'pointer' }}>
            {item.type === 1 ? <Icon sx={{ fontSize: 14 }} type={collapsed ? 'icon-wenjianjia1' : 'icon-wenjianjiadakai'} />
              : <Icon sx={{ fontSize: 14 }} type='icon-wenjian' />}
            <Box>{item.name}</Box>
          </Stack>}
          <Box sx={{ flex: 1, alignSelf: 'center', borderBottom: '1px dashed', borderColor: 'divider' }} />
          <Stack direction="row" alignItems={'center'} gap={2}>
            <Box sx={{ fontSize: 14 }}>{dayjs().format('DD/MM/YYYY')}</Box>
            <MenuSelect
              list={[
                ...(item.type === 1 ? [
                  {
                    label: '创建文件夹',
                    key: 'add-child',
                    onClick: () => {
                      setItems(items.map(i => (i.id === item.id) ? ({
                        ...item,
                        children: [
                          ...(item.children ?? []),
                          {
                            id: `${items.length + 10}`,
                            name: "",
                            level: 2,
                            type: 1,
                            isEditting: true,
                            parentId: item.id,
                          }
                        ]
                      }) : i))
                    }
                  },
                  {
                    label: '创建文档',
                    key: 'add-child',
                    onClick: () => {
                      setItems(items.map(i => (i.id === item.id) ? ({
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
                      }) : i))
                    }
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
              ]}
              context={<IconButton size="small">
                <Icon type='icon-gengduo' />
              </IconButton>}
            />
          </Stack>
        </Stack>
      </SimpleTreeItemWrapper>
    </Box>
    <DocDelete open={deleteOpen} onClose={() => setDeleteOpen(false)} data={{ id: item.id, name: item.name } as NodeDetail} refresh={refresh} />
  </Box>
});

export default TreeItem