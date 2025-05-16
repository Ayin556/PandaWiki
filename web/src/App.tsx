import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import router from "@/router";
import { useAppDispatch } from "@/store";
import { light } from '@/themes/color';
import componentStyleOverrides from "@/themes/override";
import { Box } from "@mui/material";
import { ThemeProvider } from "ct-mui";
import { useEffect } from "react";
import { useLocation, useRoutes } from "react-router-dom";
import { getKnowledgeBaseList, getUser } from "./api";
import { setKbId, setKbList, setUser } from "./store/slices/config";

function App() {
  const location = useLocation()
  const { pathname } = location
  const dispatch = useAppDispatch()
  const routerView = useRoutes(router)
  const chatPage = pathname.includes('/chat')
    || pathname.includes('/plugin')
    || pathname.includes('/demo-plugin')
  const loginPage = pathname.includes('/login')
  const docEditPage = pathname.includes('/doc/editor')
  const onlyAllowShareApi = chatPage || loginPage
  const hideLayout = chatPage || loginPage || docEditPage

  const token = localStorage.getItem('panda_wiki_token') || ''

  const getKbList = () => {
    const local_kb_id = localStorage.getItem('kb_id') || ''
    getKnowledgeBaseList().then(res => {
      dispatch(setKbList(res))
      if (res.find(item => item.id === local_kb_id)) {
        dispatch(setKbId(local_kb_id))
      } else {
        dispatch(setKbId(res[0].id))
      }
    })
  }

  useEffect(() => {
    if (onlyAllowShareApi) return
    getUser().then(res => {
      dispatch(setUser(res))
      if (docEditPage) {
        getKbList()
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  if (!token && !onlyAllowShareApi) {
    window.location.href = '/login'
    return null
  }

  return (
    <ThemeProvider
      colors={{ light }}
      mode="light"
      theme={{
        components: componentStyleOverrides,
      }}
    >
      {hideLayout ? <Box>
        {routerView}
      </Box> : <>
        <Box sx={{
          position: 'relative',
          minWidth: '1440px',
          minHeight: '100vh',
          fontSize: '16px',
          bgcolor: 'background.paper0',
        }}>
          <Sidebar />
          <Header />
          <Box sx={{
            pr: 2,
            width: 'calc(100% - 170px)',
            pt: '64px',
            ml: '170px',
            color: 'text.primary',
          }}>
            {routerView}
          </Box>
        </Box>
      </>}
    </ThemeProvider>
  )
}

export default App
