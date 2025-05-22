import { DocInfo, DocItem } from "@/assets/type";
import Doc from "@/views/doc";
import { headers } from "next/headers";

async function getDocuments(kb_id: string) {
  try {
    const res = await fetch(`http://${process.env.API_URL}/share/v1/doc/list`, {
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

async function getDocContent(id: string, kb_id: string) {
  try {
    const res = await fetch(`http://${process.env.API_URL}/share/v1/doc/detail?doc_id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-kb-id': kb_id || '',
      }
    });
    const result = await res.json()
    return (result.data || null) as DocInfo | null
  } catch (error) {
    console.error('Error fetching document content:', error);
    return null;
  }
}

export interface PageProps {
  params: Promise<{ id: string }>
}

const DocPage = async ({ params }: PageProps) => {
  const { id = '' } = await params
  const headersList = await headers()
  const kb_id = headersList.get('X-KB-ID') || ''

  const docList = await getDocuments(kb_id);
  const docInfo = await getDocContent(id, kb_id)
  return <Doc id={id} list={docList} info={docInfo} />
};

export default DocPage;
