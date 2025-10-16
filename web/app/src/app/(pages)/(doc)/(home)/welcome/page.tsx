import Welcome from '@/views/welcome';
import { getShareV1NodeRecommendList } from '@/request/ShareNode';

const WelcomePage = async () => {
  const data = await getShareV1NodeRecommendList({});
  return <Welcome recommendNodes={data?.node_recommends || []} />;
};

export default WelcomePage;
