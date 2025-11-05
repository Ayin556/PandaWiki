import { IconButton } from '@mui/material';
import { IconDark, IconLight } from '../icons';
import { useThemeStore } from '@/provider/themeStore';

const ThemeSwitch = () => {
  const { themeMode, setThemeMode } = useThemeStore();
  return (
    <IconButton
      size='small'
      onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
    >
      {themeMode === 'dark' ? <IconDark /> : <IconLight />}
    </IconButton>
  );
};

export default ThemeSwitch;
