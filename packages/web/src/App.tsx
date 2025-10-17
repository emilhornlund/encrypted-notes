import { Box } from '@mui/material';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import { LoginPage } from './components/auth/LoginForm';
import { PrivateRoute } from './components/auth/PrivateRoute';
import { RegisterPage } from './components/auth/RegisterForm';
import { MainLayout } from './components/layout/AppShell';
import { AuthProvider } from './hooks/useAuth';

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
  );
}

export default App;
