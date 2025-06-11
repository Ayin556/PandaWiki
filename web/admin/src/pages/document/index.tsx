import { getNodeList, ITreeItem, NodeListFilterData, NodeListItem } from "@/api"
import Card from "@/components/Card"
import DragTree from "@/components/Drag/DragTree"
import { convertToTree } from "@/constant/drag"
import { useURLSearchParams } from "@/hooks"
import { useAppSelector } from "@/store"
import { addOpacityToColor } from "@/utils"
import { Box, Button, Checkbox, IconButton, Stack, useTheme } from "@mui/material"
import { Icon, MenuSelect } from "ct-mui"
import { useCallback, useEffect, useState } from "react"
import DocAdd from "./component/DocAdd"
import DocDelete from "./component/DocDelete"
import DocSearch from "./component/DocSearch"

const Content = () => {
  const { kb_id } = useAppSelector(state => state.config)
  const theme = useTheme()

  const [searchParams] = useURLSearchParams()
  const search = searchParams.get('search') || ''
  const [batchOpen, setBatchOpen] = useState(false)

  const [list, setList] = useState<NodeListItem[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [data, setData] = useState<ITreeItem[]>([])
  const [opraData, setOpraData] = useState<{ id: string, name: string, type: number }[]>([])
  const [delOpen, setDelOpen] = useState(false)

  const getData = useCallback(() => {
    const params: NodeListFilterData = { kb_id }
    if (search) params.search = search
    getNodeList(params).then(res => {
      setList(res || [])
      const v = convertToTree(res || [])
      setData(v)
    })
  }, [search, kb_id])

  const onSelectChange = useCallback((id: string) => {
    // 递归获取所有子节点ID
    const getAllChildrenIds = (node: ITreeItem): string[] => {
      let ids = [node.id];
      if (node.children) {
        node.children.forEach(child => {
          ids = ids.concat(getAllChildrenIds(child));
        });
      }
      return ids;
    };

    // 递归获取所有父节点ID
    const getAllParentIds = (): string[] => {
      let ids: string[] = [];
      const findParent = (items: ITreeItem[], targetId: string): ITreeItem | null => {
        for (const item of items) {
          if (item.id === targetId) return item;
          if (item.children) {
            const found = findParent(item.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const findParents = (items: ITreeItem[], targetId: string) => {
        for (const item of items) {
          if (item.children) {
            const child = item.children.find(child => child.id === targetId);
            if (child) {
              ids.push(item.id);
              findParents(data, item.id);
              break;
            }
            findParents(item.children, targetId);
          }
        }
      };

      findParents(data, id);
      return ids;
    };

    // 检查节点的所有子节点是否都被选中
    const areAllChildrenSelected = (node: ITreeItem, currentId: string, willBeSelected: boolean, selectedIds: string[]): boolean => {
      if (!node.children) return true;
      return node.children.every(child => {
        // 如果是当前正在修改的节点，使用 willBeSelected 作为其选中状态
        if (child.id === currentId) {
          return willBeSelected;
        }
        // 对于文件夹，需要递归检查其所有子节点
        if (child.type === 1) {
          return selectedIds.includes(child.id) && areAllChildrenSelected(child, currentId, willBeSelected, selectedIds);
        }
        // 对于文件，直接检查其选中状态
        return selectedIds.includes(child.id);
      });
    };

    // 获取当前节点
    const getNodeById = (items: ITreeItem[], targetId: string): ITreeItem | null => {
      for (const item of items) {
        if (item.id === targetId) return item;
        if (item.children) {
          const found = getNodeById(item.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const node = getNodeById(data, id);
    if (!node) return;

    let newSelected = [...selected];
    const willBeSelected = !selected.includes(id);

    if (node.type === 1) { // 文件夹
      const childrenIds = getAllChildrenIds(node);
      if (selected.includes(id)) {
        // 取消选择文件夹及其所有子节点
        newSelected = newSelected.filter(item => !childrenIds.includes(item));
      } else {
        // 选择文件夹及其所有子节点
        newSelected = [...newSelected, ...childrenIds];
      }
    } else { // 文件
      if (selected.includes(id)) {
        // 取消选择文件
        newSelected = newSelected.filter(item => item !== id);
      } else {
        // 选择文件
        newSelected = [...newSelected, id];
      }
    }

    // 处理父节点的选择状态
    const parentIds = getAllParentIds();
    parentIds.forEach(parentId => {
      const parentNode = getNodeById(data, parentId);
      if (parentNode) {
        if (areAllChildrenSelected(parentNode, id, willBeSelected, newSelected)) {
          if (!newSelected.includes(parentId)) {
            newSelected.push(parentId);
          }
        } else {
          newSelected = newSelected.filter(item => item !== parentId);
        }
      }
    });
    setOpraData(list.filter(item => newSelected.includes(item.id)).map(it => ({ id: it.id, name: it.name, type: it.type })))
    setSelected(newSelected);
  }, [selected, data]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && kb_id) {
        getData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getData, kb_id]);

  useEffect(() => {
    if (kb_id) getData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, kb_id])

  return <>
    <Card>
      <Stack direction={'row'} alignItems={'center'} justifyContent={'space-between'} sx={{ p: 2 }}>
        <Box sx={{ fontSize: 16, fontWeight: 700 }}>目录</Box>
        <Stack direction={'row'} alignItems={'center'} gap={2}>
          <DocSearch />
          <DocAdd refresh={getData} />
          <MenuSelect
            list={[{
              key: 'batch',
              label: <Stack
                direction={'row'}
                alignItems={'center'}
                gap={1}
                sx={{
                  fontSize: 14, px: 2, lineHeight: '40px', height: 40, width: 180,
                  borderRadius: '5px',
                  cursor: 'pointer', ':hover': { bgcolor: addOpacityToColor(theme.palette.primary.main, 0.1) }
                }}
                onClick={() => setBatchOpen(true)}
              >
                批量操作
              </Stack>
            }]}
            context={
              <Box>
                <IconButton size="small">
                  <Icon type="icon-gengduo" />
                </IconButton>
              </Box>}
          />
        </Stack>
      </Stack>
      {batchOpen && <Stack direction={'row'} alignItems={'center'} sx={{ px: 2, mb: 2 }}>
        <Checkbox
          sx={{ color: 'text.disabled', width: '35px', height: '35px', mt: '-1px' }}
          checked={selected.length === list.length}
          onChange={(e) => {
            e.stopPropagation()
            if (selected.length === list.length) {
              setSelected([])
              setOpraData([])
            } else {
              setSelected(list.map(item => item.id))
              setOpraData(data)
            }
          }}
        />
        {selected.length > 0 ? <>
          <Box sx={{ fontSize: 14, color: 'text.secondary', mr: 2 }}>
            已选中 {selected.length} 项
          </Box>
          <Button size="small" sx={{ minWidth: 0, p: 0 }} onClick={() => {
            setDelOpen(true)
          }}>
            批量删除
          </Button>
        </> : <Box sx={{ fontSize: 14, color: 'text.secondary' }} >
          全选
        </Box>}
        <Button size="small" sx={{ color: 'text.secondary', minWidth: 0, p: 0, ml: 2 }} onClick={() => {
          setSelected([])
          setBatchOpen(false)
        }}>
          取消
        </Button>
      </Stack>}
      <Stack sx={{
        height: 'calc(100vh - 148px)',
        overflow: 'hidden',
        overflowY: 'auto',
        px: 2,
      }}>
        <DragTree data={data} refresh={getData} selected={selected} onSelectChange={onSelectChange} batchOpen={batchOpen} />
      </Stack>
    </Card>
    <DocDelete open={delOpen} onClose={() => {
      setDelOpen(false)
      setOpraData([])
      setSelected([])
      setBatchOpen(false)
    }} data={opraData} refresh={getData} />
  </>
}

export default Content