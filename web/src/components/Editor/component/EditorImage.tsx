import { uploadFile } from "@/api";
import Upload from "@/components/UploadFile/Drag";
import { Box, Popover } from "@mui/material";
import { type Editor } from '@tiptap/react';
import { useRef, useState } from "react";
import { ImagePlusIcon } from "../icons/image-plus-icon";
import EditorToolbarButton from "./EditorToolbarButton";

const EditorImage = ({ editor }: { editor: Editor }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const open = Boolean(anchorEl);
  const id = open ? 'eidtor-image' : undefined;

  const addImage = (url: string) => {
    editor.chain().focus().setImage({ src: url }).run();
    setAnchorEl(null);
  }

  const onChange = async (files: File[]) => {
    const file = files[0];
    const formData = new FormData()
    formData.append("file", file)
    const res = await uploadFile(formData);
    addImage(location.origin + '/static-file/' + res.key);
  }

  return <>
    <EditorToolbarButton
      tip={'图片'}
      ref={buttonRef}
      onClick={(e) => setAnchorEl(e.currentTarget)}
      icon={<ImagePlusIcon />}
    />
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={() => setAnchorEl(null)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 2 }}>
        <Upload
          file={[]}
          multiple={false}
          onChange={onChange}
          accept='image/*'
          type='select'
        />
      </Box>
    </Popover>
  </>
}

export default EditorImage;