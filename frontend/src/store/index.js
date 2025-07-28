import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import assignmentReducer from './assignmentSlice';
import classReducer from './classSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    assignments: assignmentReducer,
    classes: classReducer,
  },
});

export default store; 