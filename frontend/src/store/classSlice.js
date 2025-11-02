import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  classes: [],
  current: null,
  announcements: [],
  loading: false,
  error: null,
  lastFetched: null,
};

export const fetchClasses = createAsyncThunk(
  'classes/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/classes');
      // Handle the response structure from the backend
      const classes = response.data.data || response.data.classes || [];
      if (!Array.isArray(classes)) {
        console.error('Invalid classes data:', classes);
        return rejectWithValue('Invalid classes data received');
      }
      return classes;
    } catch (error) {
      console.error('Error fetching classes:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch classes'
      );
    }
  }
);

export const createClass = createAsyncThunk(
  'classes/createClass',
  async (classData, { rejectWithValue }) => {
    try {
      const response = await api.post('/classes', classData);
      // The backend returns { success: true, class: newClass }
      return response.data.class;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create class');
    }
  }
);

export const joinClass = createAsyncThunk('classes/joinClass', async (joinCode, thunkAPI) => {
  try {
    const res = await api.post(`/classes/join/${joinCode}`);
    return res.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to join class');
  }
});

export const joinClassByCode = createAsyncThunk(
  'classes/joinClassByCode',
  async (joinCode, { rejectWithValue }) => {
    try {
      const response = await api.post(`/classes/join/${joinCode}`);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to join class');
      }
      return response.data.class;
    } catch (error) {
      console.error('Join class error:', error.response || error);
      throw rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to join class. Please try again.'
      );
    }
  }
);

export const getClass = createAsyncThunk(
  'classes/getClass',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/classes/${id}`);
      if (!response.data.success) {
        return rejectWithValue(response.data.message || 'Failed to fetch class details');
      }
      return response.data.data;
    } catch (error) {
      console.error('Get class error:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch class details. Please try again.'
      );
    }
  }
);

export const fetchAnnouncements = createAsyncThunk(
  'classes/fetchAnnouncements',
  async (classId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/classes/${classId}/announcements`);
      // Always return an array, even if empty
      return Array.isArray(response.data.data) ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching announcements:', error.response || error);
      return rejectWithValue(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch announcements'
      );
    }
  }
);

const classSlice = createSlice({
  name: 'classes',
  initialState,
  reducers: {
    setCurrentClass(state, action) {
      state.current = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createClass.fulfilled, (state, action) => {
        state.loading = false;
        state.classes.push(action.payload);
      })
      .addCase(createClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(joinClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinClass.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.class) {
          state.classes.push(action.payload.class);
        }
      })
      .addCase(joinClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(joinClassByCode.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(joinClassByCode.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.classes.push(action.payload);
        }
      })
      .addCase(joinClassByCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getClass.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getClass.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getClass.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAnnouncements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnnouncements.fulfilled, (state, action) => {
        state.loading = false;
        state.announcements = action.payload;
      })
      .addCase(fetchAnnouncements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setCurrentClass } = classSlice.actions;
export default classSlice.reducer;