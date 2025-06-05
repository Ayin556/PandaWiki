import { NodeDetail } from "@/assets/type";
import Doc from "@/views/node";
import { headers } from "next/headers";

export interface PageProps {
  params: Promise<{ id: string }>
}

async function getNodeDetail(id: string, kb_id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/share/v1/node/detail?id=${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-kb-id': kb_id,
      }
    });
    const result = await res.json()
    return result.data as NodeDetail
  } catch (error) {
    console.error('Error fetching document content:', error);
    return undefined
  }
}

const DocPage = async ({ params }: PageProps) => {
  const { id = '' } = await params

  const headersList = await headers()
  const kb_id = headersList.get('x-kb-id') || process.env.DEV_KB_ID || ''

  const node = await getNodeDetail(id, kb_id)

  return <Doc node={node} />
};

export default DocPage;
