import { RouterProvider } from 'react-router-dom'
import router from './routes/index.jsx'
import AuthProvider from './components/AuthProvider.jsx'

const isPublicPath = typeof window !== 'undefined' &&
  window.location.pathname.startsWith('/track')

export default function App() {
  if (isPublicPath) {
    return <RouterProvider router={router} />
  }
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
