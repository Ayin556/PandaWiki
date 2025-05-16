import { Extension, type Editor } from '@tiptap/core';

const TabKeyExtension = Extension.create({
  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }: { editor: Editor }) => {
        // 阻止默认行为
        window.event?.preventDefault()

        // 判断是否在代码块中
        if (editor.isActive('codeBlock')) {
          editor.commands.insertContent('\t')
          return true
        }

        // 尝试缩进列表项
        if (editor.can().sinkListItem('listItem')) {
          editor.commands.sinkListItem('listItem')
          return true
        }

        // 默认插入制表符
        editor.commands.insertContent('\t')
        return true
      },
      'Shift-Tab': ({ editor }: { editor: Editor }) => {
        window.event?.preventDefault()

        // 尝试减少缩进
        if (editor.can().liftListItem('listItem')) {
          editor.commands.liftListItem('listItem')
          return true
        }
        return false
      }
    }
  }
})

export default TabKeyExtension;