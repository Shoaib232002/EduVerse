import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  classes: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchClasses = createAsyncThunk(
  'classes/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/classes');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch classes');
    }
  }
);

export const createClass = createAsyncThunk(
  'classes/createClass',
  async (classData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/classes', classData);
      // The backend returns { success: true, class: newClass }
      return response.data.class;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create class');
    }
  }
);

export const joinClass = createAsyncThunk('classes/joinClass', async (id, thunkAPI) => {
  try {
    const res = await api.post(`/api/classes/${id}/join`);
    return { id, message: res.data.message };
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to join class');
  }
});

export const joinClassByCode = createAsyncThunk(
  'classes/joinClassByCode',
  async (joinCode, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/classes/join/${joinCode}`);
      return res.data.class;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to join class');
    }
  }
);

export const getClass = createAsyncThunk('classes/getClass', async (id, thunkAPI) => {
  try {
    const res = await api.get(`/api/classes/${id}`);
    return res.data.class;
  } catch (err) {
    return thunkAPI.rejectWithValue('Failed to fetch class');
  }
});

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
        // Optionally update class list
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
        // Optionally update class list
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
      });
  },
});

export const { setCurrentClass } = classSlice.actions;
export default classSlice.reducer;