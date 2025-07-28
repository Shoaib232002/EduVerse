import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OAuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const role = params.get('role');
    if (token && role) {
      localStorage.setItem('token', token);
      let path = '/dashboard/student';
      if (role === 'teacher') path = '/dashboard/teacher';
      else if (role === 'admin') path = '/dashboard/admin';
      navigate(path, { replace: true });
    } else {
      navigate('/login');
    }
  }, [navigate]);

  return <div>Logging you in...</div>;
};

export default OAuthSuccess; 