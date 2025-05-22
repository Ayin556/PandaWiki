import { DocItem } from "@/assets/type";
import { isInIframe } from "@/utils";
import Home from "@/views/home";
import { headers } from "next/headers";

async function getDocuments(kb_id: string, app_type: string) {
  try {
    const res = await fetch(`http://${process.env.API_URL}/share/v1/app/recommand_doc?app_type=${app_type}`, {
      cache: 'no-store',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-kb-id': kb_id || '',
      },
    });
    const result = await res.json()
    return (result.data || []) as DocItem[];
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

const HomePage = async () => {
  const inIframe = isInIframe()
  const headersList = await headers()
  const kb_id = headersList.get('X-KB-ID') || ''
  const documents = await getDocuments(kb_id, inIframe ? '2' : '1');
  return <Home documents={documents} />
};

export default HomePage;
