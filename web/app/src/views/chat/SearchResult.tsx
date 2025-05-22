import { ChunkResultItem } from "@/assets/type";
import { IconArrowUp } from "@/components/icons";
import { StyledCard } from "@/components/StyledHTML";
import { Box, Stack } from "@mui/material";
import { Ellipsis } from "ct-mui";
import Link from "next/link";

const SearchResult = ({ list }: { list: ChunkResultItem[] }) => {
  return <Box sx={{ width: 'calc((100% - 24px) / 2)' }}>
    <Box sx={{
      fontSize: '20px',
      fontWeight: '700',
      lineHeight: '28px',
      mb: 2,
    }}>搜索结果</Box>
    <StyledCard sx={{
      p: 1.5,
      height: 'calc(100vh - 226px)',
      overflow: 'auto',
    }}>
      {list.map((item, idx) => (
        <Box key={item.doc_id} sx={{
          borderBottom: idx === list.length - 1 ? 'none' : '1px dashed',
          borderColor: 'divider',
        }}>
          <Link href={`/doc/${item.doc_id}`}>
            <Stack direction='row' alignItems='center' gap={3} justifyContent='space-between' sx={(theme) => ({
              borderRadius: '10px',
              px: 2,
              py: '14px',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
                '.hover-primary': {
                  color: theme.vars.palette.primary.main,
                  fontWeight: '700',
                }
              }
            })}>
              <Box sx={{ width: 'calc(100% - 80px)' }}>
                <Box className='hover-primary' sx={{
                  lineHeight: '24px',
                }}>{item.title}</Box>
                <Ellipsis sx={{ fontSize: 12, color: 'text.tertiary', lineHeight: '20px' }}>{item.content}</Ellipsis>
              </Box>
              <IconArrowUp className='hover-primary' sx={{ color: 'text.tertiary', flexShrink: 0, fontSize: 16, transform: 'rotate(90deg)' }} />
            </Stack>
          </Link>
        </Box>
      ))}
    </StyledCard>
  </Box>
};

export default SearchResult;