import { MAC_SYMBOLS } from "@/constant/enums";
import { Theme } from "@emotion/react";
import { Box, Button, Stack, SxProps, Tooltip } from "@mui/material";


interface EditorToolbarButtonProps {
  tip: string;
  shortcutKey?: string[];
  sx?: SxProps<Theme>;
  icon: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  [key: string]: any;
}

const EditorToolbarButton = ({ tip, shortcutKey, icon, sx, onClick, ...rest }: EditorToolbarButtonProps) => {
  const isMac = navigator.userAgent.includes('Mac');
  const shortcutKeyText = shortcutKey?.map(it => (isMac ? (MAC_SYMBOLS[it as keyof typeof MAC_SYMBOLS] || it) : it)).join('+');
  return (
    <Tooltip title={
      <Stack alignItems="center">
        <Box>{tip}</Box>
        {shortcutKey && <Box sx={{ fontSize: 12 }}>{shortcutKeyText}</Box>}
      </Stack>
    } arrow>
      <Button onClick={onClick} sx={{ ...sx, textTransform: 'none' }} {...rest} >
        {icon}
      </Button>
    </Tooltip>
  )
}

export default EditorToolbarButton;