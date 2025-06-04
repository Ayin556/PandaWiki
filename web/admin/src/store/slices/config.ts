import { KnowledgeBaseListItem, UserInfo } from '@/api';
import { createSlice } from '@reduxjs/toolkit';

export interface config {
  user: UserInfo
  kb_id: string
  kbList: KnowledgeBaseListItem[]
  kb_c: boolean
  modelStatus: boolean
}
const initialState: config = {
  user: {
    id: '',
    account: '',
    created_at: '',
  },
  kb_id: '',
  kbList: [],
  kb_c: false,
  modelStatus: false
}

const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setUser(state, { payload }) {
      state.user = payload
    },
    setKbId(state, { payload }) {
      localStorage.setItem('kb_id', payload)
      state.kb_id = payload
    },
    setKbList(state, { payload }) {
      state.kbList = payload
    },
    setKbC(state, { payload }) {
      state.kb_c = payload
    },
    setModelStatus(state, { payload }) {
      state.modelStatus = payload
    }
  },
})

export const { setUser, setKbId, setKbList, setKbC, setModelStatus } = configSlice.actions;
export default configSlice.reducer