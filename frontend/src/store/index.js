import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import assignmentReducer from './assignmentSlice';
import classReducer from './classSlice';
import notesReducer from './notesSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    assignments: assignmentReducer,
    classes: classReducer,
    notes: notesReducer,
  },
});

export default store; 