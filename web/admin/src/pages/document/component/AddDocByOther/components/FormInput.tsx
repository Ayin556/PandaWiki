import { ImportDocType } from '@/api';
import { Stack, TextField } from '@mui/material';

type FormData = {
  url?: string;
  app_id?: string;
  app_secret?: string;
  user_access_token?: string;
};

interface FormInputProps {
  type: ImportDocType;
  formData: FormData;
  onChange: (data: FormData) => void;
}

const FormInput = ({ type, formData, onChange }: FormInputProps) => {
  const renderUrlInput = () => (
    <>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ fontSize: 14, lineHeight: '32px' }}
      >
        URL 地址
      </Stack>
      <TextField
        fullWidth
        multiline
        rows={20}
        value={formData.url || ''}
        placeholder='每行一个 URL'
        autoFocus
        onChange={e => onChange({ ...formData, url: e.target.value })}
      />
    </>
  );

  const renderRssInput = () => (
    <>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ fontSize: 14, lineHeight: '32px' }}
      >
        RSS 地址
      </Stack>
      <TextField
        fullWidth
        value={formData.url || ''}
        placeholder='RSS 地址'
        autoFocus
        onChange={e => onChange({ ...formData, url: e.target.value })}
      />
    </>
  );

  const renderSitemapInput = () => (
    <>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ fontSize: 14, lineHeight: '32px' }}
      >
        Sitemap 地址
      </Stack>
      <TextField
        fullWidth
        value={formData.url || ''}
        placeholder='Sitemap 地址'
        autoFocus
        onChange={e => onChange({ ...formData, url: e.target.value })}
      />
    </>
  );

  const renderNotionInput = () => (
    <>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ fontSize: 14, lineHeight: '32px' }}
      >
        Integration Secret
      </Stack>
      <TextField
        fullWidth
        value={formData.url || ''}
        placeholder='Integration Secret'
        autoFocus
        onChange={e => onChange({ ...formData, url: e.target.value })}
      />
    </>
  );

  const renderFeishuInput = () => (
    <>
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ fontSize: 14, lineHeight: '32px' }}
      >
        App ID
      </Stack>
      <TextField
        fullWidth
        value={formData.app_id || ''}
        placeholder='> 飞书开放平台 > 凭证与基础信息 > 应用凭证 > App ID'
        autoFocus
        onChange={e => onChange({ ...formData, app_id: e.target.value })}
      />
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ fontSize: 14, lineHeight: '32px' }}
      >
        Client Secret
      </Stack>
      <TextField
        fullWidth
        value={formData.app_secret || ''}
        placeholder='> 飞书开放平台 > 凭证与基础信息 > 应用凭证 > App Secret'
        onChange={e => onChange({ ...formData, app_secret: e.target.value })}
      />
      <Stack
        direction='row'
        alignItems='center'
        justifyContent='space-between'
        sx={{ fontSize: 14, lineHeight: '32px' }}
      >
        User Access Token
      </Stack>
      <TextField
        fullWidth
        value={formData.user_access_token || ''}
        onChange={e =>
          onChange({ ...formData, user_access_token: e.target.value })
        }
      />
    </>
  );

  const formInputMap: Partial<Record<ImportDocType, () => React.ReactNode>> = {
    URL: renderUrlInput,
    RSS: renderRssInput,
    Sitemap: renderSitemapInput,
    Notion: renderNotionInput,
    Feishu: renderFeishuInput,
  };

  const renderInput = formInputMap[type];

  return renderInput ? <>{renderInput()}</> : null;
};

export default FormInput;
