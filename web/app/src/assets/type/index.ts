
export interface DocItem {
  id: string
  title: string
  summary: string
  url: string
}

export interface DocInfo {
  id: string
  title: string
  content: string
  meta: {
    title: string
  }
}

export interface ChunkResultItem {
  doc_id: string
  title: string
  content: string
}