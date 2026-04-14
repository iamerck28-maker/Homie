import { RouterProvider } from 'react-router-dom'
import router from './routes/index.jsx'
import AuthProvider from './components/AuthProvider.jsx'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
