import { ITreeItem } from '@/api';
import {
  TreeMenuItem,
  TreeMenuOptions,
} from '@/components/Drag/DragTree/TreeMenu';
import { ConstsCrawlerSource, V1NodeListGroupNavResp } from '@/request/types';

export interface DocPageListContainerProps {
  groups: V1NodeListGroupNavResp[];
  nav_id: string | undefined;
  search: string;
  refresh: () => void;
  wikiUrl: string;
  loading?: boolean;
  onPublishOpen: (ids?: string[]) => void;
  onRagOpen: (ids?: string[]) => void;
}

export interface DocTreeMenuHandlers {
  handleUrl: (item: ITreeItem, key: ConstsCrawlerSource) => void;
  handleDelete: (item: ITreeItem) => void;
  handlePublish: (item: ITreeItem) => void;
  handleRestudy: (item: ITreeItem) => void;
  handleProperties: (item: ITreeItem) => void;
  handleFrontDoc: (id: string) => void;
}

export type DocTreeMenuFn = (opra: TreeMenuOptions) => TreeMenuItem[];
