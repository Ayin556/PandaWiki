'use client'

import { NodeListItem } from "@/assets/type";
import { useNodeList } from "@/provider/nodelist-provider";
import { CusTabs } from "ct-mui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";


const PageChange = () => {
  const { nodeList } = useNodeList()
  const pathname = usePathname();
  const router = useRouter();
  const [value, setValue] = useState('home');
  const [firstNodeId, setFirstNodeId] = useState('')

  useEffect(() => {
    setValue(pathname.split('/')[1] || 'home');
  }, [pathname])

  useEffect(() => {
    if (nodeList) {
      const firstNode = nodeList.sort((a: NodeListItem, b: NodeListItem) => a.position - b.position)[0]
      setFirstNodeId(firstNode.id)
    }
  }, [])

  return <CusTabs
    sx={{
      bgcolor: 'transparent',
      border: '1px solid',
      borderColor: 'primary.main',
      height: 36.5,
      p: '2px',
      borderRadius: '6px',
      '.MuiTab-root': {
        p: '4px 16px !important',
        lineHeight: '22px !important',
        color: 'primary.main',
        '&.Mui-selected': {
          color: 'white',
        }
      },
      '.MuiTabs-scroller': {
        height: 30.5,
        borderRadius: '4px',
      },
      '.MuiTabs-indicator': {
        width: 88,
        height: 30.5,
        borderRadius: '4px',
        bgcolor: 'primary.main',
      }
    }}
    value={value}
    change={(value: string) => {
      if (value === 'home') {
        router.push('/')
      } else {
        router.push(`/node/${firstNodeId}`)
      }
    }}
    list={[{
      label: '问答模式',
      value: 'home',
    }, {
      label: '文档模式',
      value: 'node',
    }]} />
}

export default PageChange;