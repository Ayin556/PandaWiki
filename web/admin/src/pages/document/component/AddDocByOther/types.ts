export type DocumentStatus =
  | 'default'
  | 'waiting'
  | 'uploading'
  | 'upload-done'
  | 'upload-error'
  | 'pulling'
  | 'pull-done'
  | 'pull-error'
  | 'creating'
  | 'success'
  | 'error';

export type ItemType = 'file' | 'other' | 'folder';

export type DataItem = {
  id: string;
  uuid: string;
  title: string;
  file?: File;
  content?: string;
  progress?: number;
  type: ItemType;
  space_id?: string;
  file_type?: string;
  open?: boolean;
  status: DocumentStatus;
};

export type FormData = {
  url?: string;
  app_id?: string;
  app_secret?: string;
  user_access_token?: string;
};

export type TotalCount = {
  loading: number;
  fail: number;
  default: number;
  waiting: number;
  uploading: number;
  pulling: number;
  creating: number;
  'upload-done': number;
  'pull-done': number;
  success: number;
  'upload-error': number;
  'pull-error': number;
  error: number;
};
