import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { joinClassByCode } from '../store/classSlice';

const JoinClassPage = () => {
  const { joinCode } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { loading, error } = useSelector((state) => state.classes);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'student') {
      setMsg('Only students can join classes.');
      return;
    }
    dispatch(joinClassByCode(joinCode)).then((res) => {
      if (res.meta.requestStatus === 'fulfilled') {
        setMsg('Joined class successfully!');
        setTimeout(() => navigate('/classes'), 1000); // Redirect to /classes after success
      } else {
        setMsg('Failed to join class.');
      }
    });
    // eslint-disable-next-line
  }, [dispatch, joinCode, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Join Class</h2>
        {loading ? <div>Joining...</div> : (
          <>
            {msg && <div className={`mb-4 ${msg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{msg}</div>}
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded mt-2"
              onClick={() => navigate('/classes')}
            >Go to My Classes</button>
          </>
        )}
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default JoinClassPage;