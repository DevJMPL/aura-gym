import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GymProvider } from './contexts/GymContext'
import { AppRoutes } from './app/routes'

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <GymProvider>
          <AppRoutes />
        </GymProvider>
      </AuthProvider>
    </HashRouter>
  )
}

export default App
