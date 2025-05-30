import { getNodeList, ITreeItem, NodeListFilterData } from "@/api"
import DragTree from "@/components/Drag/DragTree"
import { convertToTree } from "@/constant/drag"
import { useAppSelector } from "@/store"
import { Modal } from "ct-mui"
import { useCallback, useEffect, useState } from "react"

interface AddRecommendContentProps {
  open: boolean
  selected: string[]
  onChange: (value: string[]) => void
  onClose: () => void
}

const AddRecommendContent = ({ open, selected, onChange, onClose }: AddRecommendContentProps) => {
  const [list, setList] = useState<ITreeItem[]>([])
  const { kb_id } = useAppSelector(state => state.config)
  const [selectedIds, setSelectedIds] = useState<string[]>(selected)

  const getData = useCallback(() => {
    const params: NodeListFilterData = { kb_id }
    getNodeList(params).then(res => {
      const v = convertToTree(res || [])
      setList(v)
    })
  }, [kb_id])

  useEffect(() => {
    setSelectedIds(selected)
  }, [selected])

  useEffect(() => {
    if (open && kb_id) getData()
  }, [open, kb_id, getData])

  return <Modal
    title="添加卡片"
    open={open}
    onOk={() => {
      onChange(selectedIds)
      onClose()
    }}
    onCancel={onClose}
  >
    <DragTree
      type='select'
      selected={selectedIds}
      data={list}
      refresh={getData}
      onSelectChange={setSelectedIds}
    />
  </Modal>
}

export default AddRecommendContent