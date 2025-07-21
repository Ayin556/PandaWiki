import {
  ChatConversationPair,
  ConversationDetail,
  getConversationDetail,
} from '@/api';
import Avatar from '@/components/Avatar';
import Card from '@/components/Card';
import MarkDown from '@/components/MarkDown';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  useTheme,
} from '@mui/material';
import { Ellipsis, Icon, Modal } from 'ct-mui';
import { useEffect, useState } from 'react';

const Detail = ({
  id,
  open,
  onClose,
  data,
}: {
  id: string;
  open: boolean;
  data: any;
  onClose: () => void;
}) => {
  const theme = useTheme();
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [conversations, setConversations] = useState<
    ChatConversationPair[] | null
  >(null);

  useEffect(() => {
    if (data.length > 0) {
      const pairs: ChatConversationPair[] = [];
      const question = data[1];
      const answer = data[0];
      pairs.push({
        user: question.content,
        assistant: answer.content,
        created_at: question.created_at,
        info: answer.info,
      } as ChatConversationPair);

      setConversations(pairs);
    }
  }, [data]);

  return (
    <Modal
      title={
        <Ellipsis
          sx={{
            fontWeight: 'bold',
            fontSize: 20,
            lineHeight: '22px',
            width: 700,
          }}
        >
          问答记录
        </Ellipsis>
      }
      width={800}
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Box sx={{ fontSize: 14 }}>
        <Stack gap={2}>
          {conversations &&
            conversations.map((item, index) => (
              <Box key={index}>
                <Accordion defaultExpanded={true}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ fontSize: 24 }} />}
                    sx={{
                      userSelect: 'text',
                      backgroundColor: 'background.paper2',
                      fontSize: '18px',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.user}
                  </AccordionSummary>
                  <AccordionDetails>
                    <MarkDown content={item.assistant || '未查询到回答内容'} />
                  </AccordionDetails>
                </Accordion>
              </Box>
            ))}
        </Stack>
      </Box>
    </Modal>
  );
};

export default Detail;
