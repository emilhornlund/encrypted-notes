import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material'
import {
  Notes as NotesIcon,
  Search as SearchIcon,
  Label as LabelIcon,
  Add as AddIcon,
} from '@mui/icons-material'

const drawerWidth = 240

export const Sidebar: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { text: 'All Notes', path: '/', icon: <NotesIcon /> },
    { text: 'Search', path: '/search', icon: <SearchIcon /> },
    { text: 'Tags', path: '/tags', icon: <LabelIcon /> },
  ]

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: 64, // AppBar height
          height: 'calc(100vh - 64px)',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <ListItemButton
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': {
              bgcolor: 'primary.dark',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <AddIcon />
          </ListItemIcon>
          <ListItemText primary="New Note" />
        </ListItemButton>
      </Box>

      <Divider />

      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  )
}