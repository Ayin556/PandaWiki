import { getShareV1AppWebInfo } from '@/request/ShareApp';
import { getShareV1NodeDetail } from '@/request/ShareNode';
import { formatMeta } from '@/utils';
import Doc from '@/views/node';
import { ResolvingMetadata } from 'next';

export interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata,
) {
  const { id } = await params;
  let node = {
    name: '无权访问',
    meta: {
      summary: '无权访问',
    },
  };
  try {
    // @ts-ignore
    node = (await getShareV1NodeDetail({ id })) as any;
  } catch (error) {
    console.log(error);
  }

  return await formatMeta(
    { title: node?.name, description: node?.meta?.summary },
    parent,
  );
}

const DocPage = async ({ params }: PageProps) => {
  const { id = '' } = await params;
  const [node, kbInfo]: any = await Promise.all([
    // @ts-ignore
    getShareV1NodeDetail({ id }),
    getShareV1AppWebInfo(),
  ]);
  return <Doc node={node} kbInfo={kbInfo} commentList={[]} />;
};

export default DocPage;
