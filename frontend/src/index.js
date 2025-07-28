import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import App from './App';
import store from './store';
import './styles/tailwind.css';
import { rehydrateUser } from './store/authSlice';

function RehydrateUser() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(rehydrateUser());
  }, [dispatch]);
  return null;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <RehydrateUser />
      <App />
    </BrowserRouter>
  </Provider>
); 