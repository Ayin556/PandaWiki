import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { Box } from '@mui/material';
import { Icon } from 'ct-mui';
import React, { useCallback, useState } from 'react';

interface EmojiPickerProps {
  defaultValue?: string;
  onChange: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  defaultValue,
  onChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [emoji, setEmoji] = useState(defaultValue || '');

  const handleSelect = useCallback((emoji: any) => {
    onChange(emoji.native);
    setEmoji(emoji.native);
    setShowPicker(false);
  }, [onChange]);

  const togglePicker = useCallback(() => {
    setShowPicker(prev => !prev);
  }, []);

  return (
    <Box sx={{
      position: 'relative',
    }}>
      <Box sx={{ fontSize: 14, lineHeight: '36px', mt: 1 }}>添加 Icon</Box>
      <Box onClick={togglePicker} sx={{
        fontSize: '24px',
        cursor: 'pointer',
        padding: '4px',
      }}>
        {emoji ? emoji : <Icon type='icon-wenjian' />}
      </Box>
      {showPicker && <Picker
        data={data}
        set='native'
        theme='light'
        locale='中文'
        onEmojiSelect={handleSelect}
        previewPosition="none"
        searchPosition="sticky"
        skinTonePosition="none"
        perLine={9}
        emojiSize={24}
        navPosition="none"
      />}
    </Box>
  );
};

export default EmojiPicker;