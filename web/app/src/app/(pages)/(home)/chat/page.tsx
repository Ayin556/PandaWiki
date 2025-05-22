import Chat from "@/views/chat";
import { headers } from "next/headers";

const ChatPage = async () => {
  const headersList = await headers();
  const kb_id = headersList.get('X-KB-ID') || '';

  return <Chat id={kb_id} />;
};

export default ChatPage;
