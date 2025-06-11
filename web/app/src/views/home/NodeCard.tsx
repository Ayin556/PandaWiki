import { RecommendNode } from "@/assets/type";
import { IconFile, IconFolder } from "@/components/icons";
import { StyledCard } from "@/components/StyledHTML";
import { useMobile } from "@/provider/mobile-provider";
import { Box, Stack } from "@mui/material";
import { Ellipsis } from "ct-mui";
import Link from "next/link";

const NodeFolder = ({ node }: { node: RecommendNode }) => {
  const children = node.recommend_nodes?.sort((a, b) => (a.position ?? 0) - (b.position ?? 0)) || []
  return <Stack direction="column" justifyContent="space-between" sx={{ cursor: 'pointer', height: '100%' }}>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexShrink: 0 }}>
      {node.emoji ? <Box sx={{ flexShrink: 0, fontSize: 14 }}>{node.emoji}</Box> : <IconFolder sx={{ flexShrink: 0 }} />}
      <Ellipsis sx={{ fontSize: '18px', lineHeight: '26px' }}>{node.name}</Ellipsis>
    </Stack>
    <Box sx={{ flex: 1 }}>
      {children.slice(0, 4)
        .map(it => <Box
          key={it.id}
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          <Link href={`/node/${it.id}`} target="_blank">
            <Stack direction="row" alignItems={'center'} gap={1} sx={{ fontSize: 14, lineHeight: '21px' }}>
              {it.emoji ? <Box sx={{ flexShrink: 0, color: 'text.primary', fontSize: 12 }}>{it.emoji}</Box> : <IconFile sx={{ mt: '-2px' }} />}
              <Ellipsis>{it.name}</Ellipsis>
            </Stack>
          </Link>
        </Box>)}
    </Box>
    <Stack direction="row" gap={2} justifyContent="flex-end" sx={{ mt: 2, flexShrink: 0 }}>
      <Link href={`/node/${children[0]?.id || node.id}`} target="_blank">
        <Box sx={{
          color: 'primary.main', fontSize: 14, ':hover': {
            fontWeight: 'bold'
          }
        }}>
          查看更多
        </Box>
      </Link>
    </Stack>
  </Stack>
}

const NodeFile = ({ node }: { node: RecommendNode }) => {
  return <Link href={`/node/${node.id}`} target="_blank">
    <Stack direction="column" justifyContent="space-between" sx={{ cursor: 'pointer', height: '100%' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, flexShrink: 0 }}>
        {node.emoji ? <Box sx={{ flexShrink: 0, fontSize: 14 }}>{node.emoji}</Box> : <IconFile sx={{ flexShrink: 0 }} />}
        <Ellipsis sx={{ fontSize: '18px', lineHeight: '26px' }}>{node.name}</Ellipsis>
      </Stack>
      <Box sx={{ flex: 1 }}>
        {node.summary ? <Box className="ellipsis-4" sx={{ color: 'text.secondary', fontSize: 14 }}>{node.summary}</Box>
          : <Box sx={{ color: 'text.disabled', fontSize: 14 }}>暂无摘要</Box>}
      </Box>
      <Stack direction="row" gap={2} justifyContent="flex-end" sx={{ mt: 2, flexShrink: 0 }}>
        <Box sx={{
          color: 'primary.main', fontSize: 14, ':hover': {
            fontWeight: 'bold'
          }
        }}>
          查看详情
        </Box>
      </Stack>
    </Stack>
  </Link>
}

const DocCard = ({ node }: { node: RecommendNode }) => {
  const { mobile = false } = useMobile()
  return <StyledCard sx={{
    width: mobile ? 'calc(100% - 48px)' : 'calc((100% - 32px) / 3)',
    transition: 'all 0.3s ease',
    ':hover': {
      boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
    },
    color: 'text.primary',
  }}>
    {node.type === 2 ? <NodeFile node={node} /> : <NodeFolder node={node} />}
  </StyledCard>
};

export default DocCard;