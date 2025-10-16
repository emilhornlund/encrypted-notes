import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Fab,
  Pagination,
  Stack,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { NotesListResponse } from '@encrypted-notes/common';

const NOTES_PER_PAGE = 20;

export const NotesList: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NotesListResponse['notes']>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [currentPage, setCurrentPage] = useState(1);

  const fetchNotes = async (cursor?: string) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/notes', window.location.origin);
      url.searchParams.set('limit', NOTES_PER_PAGE.toString());
      if (cursor) {
        url.searchParams.set('cursor', cursor);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data: NotesListResponse = await response.json();
      setNotes(data.notes);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [token]);

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    page: number
  ) => {
    setCurrentPage(page);
    // For now, we'll refetch from the beginning
    // In a more sophisticated implementation, we'd cache pages
    fetchNotes();
  };

  const handleNewNote = () => {
    navigate('/notes/new');
  };

  const handleNoteClick = (noteId: string) => {
    navigate(`/notes/${noteId}`);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {notes.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No notes yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create your first encrypted note to get started.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewNote}
          >
            Create Note
          </Button>
        </Box>
      ) : (
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography variant="h5">Your Notes ({notes.length})</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleNewNote}
            >
              New Note
            </Button>
          </Box>

          <Stack spacing={2}>
            {notes.map((note) => (
              <Card
                key={note.id}
                sx={{ cursor: 'pointer' }}
                onClick={() => handleNoteClick(note.id)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Note {note.id.slice(0, 8)}...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Created: {formatDate(note.created_at)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updated: {formatDate(note.updated_at)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>

          {nextCursor && (
            <Box display="flex" justifyContent="center" mt={3}>
              <Pagination
                count={currentPage + 1} // Simplified pagination
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add note"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' },
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};
