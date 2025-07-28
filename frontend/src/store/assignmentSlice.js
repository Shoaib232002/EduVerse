import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  assignments: [],
  current: null,
  loading: false,
  error: null,
  // Add a place to store comments and rubric if needed globally
  comments: [], // for global comments if needed
  rubric: null, // for global rubric if needed
};

export const fetchAssignments = createAsyncThunk('assignments/fetchAssignments', async (classId, thunkAPI) => {
  try {
    const res = await api.get(`/api/assignments/${classId}`);
    return res.data.assignments;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to fetch assignments');
  }
});

export const getAssignment = createAsyncThunk('assignments/getAssignment', async (id, thunkAPI) => {
  try {
    const res = await api.get(`/api/assignments/details/${id}`);
    return res.data.assignment;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to fetch assignment');
  }
});

export const createAssignment = createAsyncThunk('assignments/createAssignment', async (data, thunkAPI) => {
  try {
    const formData = new FormData();
    // Support multiple files
    if (data.files && data.files.length > 0) {
      Array.from(data.files).forEach(file => formData.append('files', file));
    }
    // Support rubric as JSON string
    if (data.rubric) {
      formData.append('rubric', JSON.stringify(data.rubric));
    }
    // Add other fields
    ['classId', 'title', 'description', 'dueDate', 'topic', 'scheduledAt', 'isDraft'].forEach(key => {
      if (data[key] !== undefined) formData.append(key, data[key]);
    });
    const res = await api.post('/api/assignments', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.assignment;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to create assignment');
  }
});

export const submitAssignment = createAsyncThunk('assignments/submitAssignment', async ({ id, files, textEntry }, thunkAPI) => {
  try {
    const formData = new FormData();
    if (files && files.length > 0) {
      Array.from(files).forEach(file => formData.append('files', file));
    }
    if (textEntry) formData.append('textEntry', textEntry);
    const res = await api.post(`/api/assignments/${id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to submit assignment');
  }
});

// Add thunk for adding a comment to a submission
export const addSubmissionComment = createAsyncThunk('assignments/addSubmissionComment', async ({ assignmentId, submissionId, text }, thunkAPI) => {
  try {
    const res = await api.post(`/api/assignments/${assignmentId}/submission/${submissionId}/comment`, { text });
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to add comment');
  }
});

const assignmentSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments = action.payload;
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.assignments.push(action.payload);
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(submitAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitAssignment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle addSubmissionComment
      .addCase(addSubmissionComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSubmissionComment.fulfilled, (state, action) => {
        state.loading = false;
        // Update comments for the relevant submission in current assignment
        if (state.current && state.current.submissions) {
          const { submissionId, comment } = action.payload;
          const submission = state.current.submissions.find(s => s._id === submissionId);
          if (submission) {
            if (!submission.comments) submission.comments = [];
            submission.comments.push(comment);
          }
        }
      })
      .addCase(addSubmissionComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default assignmentSlice.reducer;