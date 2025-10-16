import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import { AuthProvider } from './hooks/useAuth'
import { LoginPage } from './components/auth/LoginForm'
import { RegisterPage } from './components/auth/RegisterForm'
import { MainLayout } from './components/layout/AppShell'
import { PrivateRoute } from './components/auth/PrivateRoute'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            />
          </Routes>
        </Box>
      </Router>
    </AuthProvider>
  )
}

export default App