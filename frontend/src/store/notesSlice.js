import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

// Async thunk for fetching notes
export const fetchNotes = createAsyncThunk(
  'notes/fetchNotes',
  async (classId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/notes/${classId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notes');
    }
  }
);

// Async thunk for uploading notes
export const uploadNotes = createAsyncThunk(
  'notes/uploadNotes',
  async ({ classId, formData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/notes/upload/${classId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload notes');
    }
  }
);

// Async thunk for deleting notes
export const deleteNotes = createAsyncThunk(
  'notes/deleteNotes',
  async ({ classId, noteId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/notes/${classId}/${noteId}`);
      // Return updated notes array from backend
      return response.data.notes;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete notes');
    }
  }
);

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    loading: false,
    error: null,
    uploadStatus: 'idle', // 'idle' | 'loading' | 'success' | 'error'
  },
  reducers: {
    clearNotes: (state) => {
      state.notes = [];
      state.error = null;
    },
    clearUploadStatus: (state) => {
      state.uploadStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notes
      .addCase(fetchNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.loading = false;
        // Always set notes to response.data.notes (array)
        state.notes = Array.isArray(action.payload?.notes) ? action.payload.notes : [];
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Upload notes
      .addCase(uploadNotes.pending, (state) => {
        state.uploadStatus = 'loading';
        state.error = null;
      })
      .addCase(uploadNotes.fulfilled, (state, action) => {
        state.uploadStatus = 'success';
        // After upload, set notes to response.data.notes if available
        if (Array.isArray(action.payload?.notes)) {
          state.notes = action.payload.notes;
        } else if (action.payload?.note) {
          state.notes.push(action.payload.note);
        }
      })
      .addCase(uploadNotes.rejected, (state, action) => {
        state.uploadStatus = 'error';
        state.error = action.payload;
      })
      // Delete notes
      .addCase(deleteNotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNotes.fulfilled, (state, action) => {
        state.loading = false;
        // Set notes to updated array from backend
        state.notes = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(deleteNotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearNotes, clearUploadStatus } = notesSlice.actions;
export default notesSlice.reducer;
