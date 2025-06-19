'use client'

import { useNodeList } from "@/provider/nodelist-provider";
import { convertToTree, findFirstType2Node } from "@/utils/drag";
import { CusTabs } from "ct-mui";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";


const PageChange = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { nodeList } = useNodeList()
  const tree = convertToTree(nodeList || [])

  const [value, setValue] = useState('welcome');
  const [firstNodeId, setFirstNodeId] = useState('')

  useEffect(() => {
    const path = pathname.split('/')[1]
    setValue(['welcome', 'node'].includes(path) ? path : 'welcome');
  }, [pathname])

  useEffect(() => {
    if (tree.length > 0) {
      const firstType2Id = findFirstType2Node(tree);
      if (firstType2Id) {
        setFirstNodeId(firstType2Id);
      }
    }
  }, [tree])

  if (!firstNodeId) return null

  return <CusTabs
    sx={{
      bgcolor: 'transparent',
      border: '1px solid',
      borderColor: 'primary.main',
      height: 36,
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
        height: 30,
        borderRadius: '4px',
      },
      '.MuiTabs-indicator': {
        width: 88,
        height: 30,
        borderRadius: '4px',
        bgcolor: 'primary.main',
      }
    }}
    value={value}
    change={(value: string) => {
      if (value === 'welcome') {
        router.push('/welcome')
      } else {
        router.push(`/node/${firstNodeId}`)
      }
    }}
    list={[
      {
        label: '问答模式',
        value: 'welcome',
      }, {
        label: '文档模式',
        value: 'node',
      }
    ]}
  />
}

export default PageChange;