import { useKBDetail } from "@/provider/kb-provider";
import { Box, Stack } from "@mui/material";
import Link from "next/link";

const QuestionList = () => {
  const { kbDetail, themeMode } = useKBDetail()

  if (!kbDetail?.settings?.recommend_questions) return null

  return <Stack direction="row" alignItems={'center'} justifyContent={'center'} flexWrap="wrap" gap={2} sx={{ mt: 3, mb: 10 }}>
    {kbDetail?.settings?.recommend_questions?.map((item) => (
      <Link href={`/chat?search=${item}`} key={item} target="_blank">
        <Box sx={{
          border: '1px solid',
          borderRadius: '16px',
          fontSize: 14,
          color: 'text.secondary',
          lineHeight: '32px',
          height: '32px',
          borderColor: 'divider',
          px: 2,
          cursor: 'pointer',
          bgcolor: themeMode === 'dark' ? 'background.paper' : 'background.default',
          '&:hover': {
            borderColor: 'primary.main',
            color: 'primary.main',
          }
        }}>{item}</Box>
      </Link>
    ))}
  </Stack>
}

export default QuestionList