import { useURLSearchParams } from '@/hooks';
import VersionPublish from '@/pages/release/components/VersionPublish';
import { getApiV1NodeListGroupNav } from '@/request/Node';
import {
  GithubComChaitinPandaWikiApiNodeV1NodeListGroupNavResp,
  V1NavListResp,
} from '@/request/types';
import { useAppDispatch, useAppSelector } from '@/store';
import { setIsRefreshDocList, setNavId } from '@/store/slices/config';
import { Stack } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RagErrorReStart from '../component/RagErrorReStart';
import DocPageHeader from './DocPageHeader';
import DocPageList from './DocPageList';
import DocPageNavs from './DocPageNavs';

const Content = () => {
  const { kb_id, isRefreshDocList, kbList } = useAppSelector(
    state => state.config,
  );
  const dispatch = useAppDispatch();
  const nav_id = useAppSelector(state => state.config.nav_id) || undefined;

  const [searchParams] = useURLSearchParams();
  const search = searchParams.get('search') || '';

  const [publishOpen, setPublishOpen] = useState(false);
  const [publishIds, setPublishIds] = useState<string[]>([]);
  const [ragOpen, setRagOpen] = useState(false);
  const [ragIds, setRagIds] = useState<string[]>([]);
  const [groups, setGroups] = useState<
    GithubComChaitinPandaWikiApiNodeV1NodeListGroupNavResp[]
  >([]);
  const [navList, setNavList] = useState<V1NavListResp[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const getData = useCallback(() => {
    if (!kb_id) {
      setLoading(false);
      return;
    }
    const params: { kb_id: string; search?: string } = { kb_id };
    if (search) params.search = search;
    setLoading(true);
    getApiV1NodeListGroupNav(params)
      .then(res => {
        const list = res || [];
        setGroups(list);
        const nextNavList = list
          .map(g => ({
            id: g.nav_id,
            name: g.nav_name,
            position: g.position ?? 0,
          }))
          .filter(n => n.id)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        setNavList(nextNavList);
        if (nextNavList.length > 0) {
          const storedNavId = kb_id
            ? localStorage.getItem(`nav_id_${kb_id}`)
            : null;
          const validInList =
            storedNavId && nextNavList.some(n => n.id === storedNavId);
          const idToUse = validInList ? storedNavId! : nextNavList[0].id!;
          dispatch(setNavId(idToUse));
        } else {
          dispatch(setNavId(''));
        }
        setHasLoadedOnce(true);
      })
      .finally(() => setLoading(false));
  }, [search, kb_id, dispatch]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refresh = useCallback(() => {
    getData();
    setRefreshTrigger(t => t + 1);
  }, [getData]);

  const currentKb = useMemo(() => {
    return kbList?.find(item => item.id === kb_id);
  }, [kbList, kb_id]);

  const [wikiUrl, setWikiUrl] = useState<string>('');

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && kb_id) {
        getData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [getData, kb_id]);

  useEffect(() => {
    if (currentKb?.access_settings?.base_url) {
      setWikiUrl(currentKb.access_settings.base_url);
      return;
    }
    const host = currentKb?.access_settings?.hosts?.[0] || '';
    if (host === '') return;
    const { ssl_ports = [], ports = [] } = currentKb?.access_settings || {};

    if (ssl_ports) {
      if (ssl_ports.includes(443)) setWikiUrl(`https://${host}`);
      else if (ssl_ports.length > 0)
        setWikiUrl(`https://${host}:${ssl_ports[0]}`);
    } else if (ports) {
      if (ports.includes(80)) setWikiUrl(`http://${host}`);
      else if (ports.length > 0) setWikiUrl(`http://${host}:${ports[0]}`);
    }
  }, [currentKb]);

  useEffect(() => {
    if (kb_id) getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, kb_id]);

  useEffect(() => {
    if (isRefreshDocList) {
      refresh();
      dispatch(setIsRefreshDocList(false));
    }
  }, [isRefreshDocList, refresh, dispatch]);

  return (
    <>
      <DocPageHeader
        onPublishClick={() => {
          setPublishIds([]);
          setPublishOpen(true);
        }}
        onRagClick={() => {
          setRagIds([]);
          setRagOpen(true);
        }}
        refreshTrigger={refreshTrigger}
      />
      <Stack direction={'row'} gap={2} sx={{ mt: 2 }}>
        <DocPageNavs
          navList={navList}
          onNavListChange={setNavList}
          onNavDeleted={navId => {
            setGroups(prev => prev.filter(g => g.nav_id !== navId));
          }}
          refresh={refresh}
          isSearching={!!search}
          loading={loading && !hasLoadedOnce}
        />
        <DocPageList
          groups={groups}
          nav_id={nav_id}
          search={search}
          refresh={refresh}
          wikiUrl={wikiUrl}
          loading={loading && !hasLoadedOnce}
          onPublishOpen={ids => {
            setPublishIds(ids ?? []);
            setPublishOpen(true);
          }}
          onRagOpen={ids => {
            setRagIds(ids ?? []);
            setRagOpen(true);
          }}
        />
      </Stack>
      <VersionPublish
        open={publishOpen}
        defaultSelected={publishIds}
        onClose={() => {
          setPublishOpen(false);
          setPublishIds([]);
        }}
        refresh={refresh}
      />
      <RagErrorReStart
        open={ragOpen}
        defaultSelected={ragIds}
        onClose={() => {
          setRagOpen(false);
          setRagIds([]);
        }}
        refresh={refresh}
      />
    </>
  );
};

export default Content;
