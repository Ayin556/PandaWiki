/// <reference types="vite/client" />
import { Mark } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mark: {
      removeMark: (
        type: string | Mark,
        options?: {
          extendEmptyMarkRange?: boolean
        }
      ) => ReturnType
    },
    fontSize: {
      setFontSize: (size: number) => ReturnType
      unsetFontSize: () => ReturnType
    }
  }
}