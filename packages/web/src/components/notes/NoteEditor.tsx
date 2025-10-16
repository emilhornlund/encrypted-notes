import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { cryptoService } from '../../services/crypto.service';
import {
  CreateNoteRequest,
  UpdateNoteRequest,
  NoteResponse,
} from '@encrypted-notes/common';

export const NoteEditor: React.FC = () => {
  const { id: noteId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, userKeys } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load existing note if editing
  useEffect(() => {
    if (noteId && token && userKeys) {
      loadNote();
    }
  }, [noteId, token, userKeys]);

  const loadNote = async () => {
    if (!token || !noteId || !userKeys) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load note');
      }

      const note: NoteResponse = await response.json();

      // Decrypt the note content
      const encryptedData = {
        titleCt: note.titleCt,
        ivTitle: note.ivTitle,
        bodyCt: note.bodyCt,
        ivBody: note.ivBody,
        termHashes: [], // Not needed for decryption
      };

      const { title, body } = await cryptoService.decryptNote(
        encryptedData,
        userKeys
      );

      setTitle(title);
      setBody(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load note');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!token || !userKeys) return;

    setSaving(true);
    setError(null);

    try {
      // Encrypt the note content
      const encryptedData = await cryptoService.encryptNote(
        title,
        body,
        userKeys
      );

      const noteData: CreateNoteRequest | UpdateNoteRequest = {
        titleCt: encryptedData.titleCt as any,
        ivTitle: encryptedData.ivTitle as any,
        bodyCt: encryptedData.bodyCt as any,
        ivBody: encryptedData.ivBody as any,
        termHashes: encryptedData.termHashes as any,
      };

      let response: Response;
      if (noteId) {
        // Update existing note
        response = await fetch(`/api/notes/${noteId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });
      } else {
        // Create new note
        response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(noteData),
        });
      }

      if (!response.ok) {
        throw new Error('Failed to save note');
      }

      setIsDirty(false);
      navigate('/notes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
    setIsDirty(true);
  };

  const handleBodyChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBody(event.target.value);
    setIsDirty(true);
  };

  // Auto-save functionality (debounced)
  const debouncedSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if ((isDirty && title.trim()) || body.trim()) {
            handleSave();
          }
        }, 2000); // Auto-save after 2 seconds of inactivity
      };
    })(),
    [isDirty, title, body]
  );

  useEffect(() => {
    if (isDirty) {
      debouncedSave();
    }
  }, [title, body, debouncedSave]);

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

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/notes')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {noteId ? 'Edit Note' : 'New Note'}
          </Typography>
          <Button
            color="inherit"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Note title..."
            value={title}
            onChange={handleTitleChange}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                fontSize: '1.5rem',
                fontWeight: 500,
              },
            }}
            inputProps={{
              style: { fontSize: '1.5rem', fontWeight: 500 },
            }}
          />

          <TextField
            fullWidth
            multiline
            variant="outlined"
            placeholder="Start writing your note..."
            value={body}
            onChange={handleBodyChange}
            minRows={10}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontFamily: 'monospace',
              },
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: 'block' }}
          >
            Note: Content encryption/decryption will be implemented in the next
            phase.
            {isDirty && ' • Unsaved changes'}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};
