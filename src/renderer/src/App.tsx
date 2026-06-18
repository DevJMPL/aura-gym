import { HashRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { GymProvider } from './contexts/GymContext'
import { TenantProvider } from './contexts/TenantContext'
import { AppRoutes } from './app/routes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <TenantProvider>
            <GymProvider>
              <AppRoutes />
            </GymProvider>
          </TenantProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  )
}

export default App
