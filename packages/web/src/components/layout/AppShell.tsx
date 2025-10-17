import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { NoteEditor } from '../notes/NoteEditor';
import { NotesList } from '../notes/NotesList';
import { Sidebar } from './Sidebar';

const TagsPage = () => <div>Tags Page - Coming Soon</div>;
const SearchPage = () => <div>Search Page - Coming Soon</div>;

export const MainLayout: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Encrypted Notes
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            {user?.email}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Routes>
          <Route path="/" element={<NotesList />} />
          <Route path="/notes" element={<NotesList />} />
          <Route path="/notes/new" element={<NoteEditor />} />
          <Route path="/notes/:id" element={<NoteEditor />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </Box>
    </Box>
  );
};
