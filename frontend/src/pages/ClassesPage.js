import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchClasses } from '../store/classSlice';
import { useNavigate } from 'react-router-dom';

const ClassesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { classes, loading, error } = useSelector((state) => state.classes);

  useEffect(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mt-10 mb-4">My Classes</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes && classes.length > 0 ? (
          classes.map((cls) => (
            <div key={cls._id} className="bg-white p-4 rounded shadow cursor-pointer"
                 onClick={() => navigate(`/classroom/${cls._id}`)}>
              <h2 className="font-semibold text-lg">{cls.name}</h2>
              <p className="text-gray-600">{cls.description}</p>
              <div className="mt-2 text-sm text-gray-500">Teacher: {cls.teacher?.name || 'N/A'}</div>
              {/* Add the class/meeting link here */}
              <div className="mt-2">
                <span className="font-semibold">Class Link: </span>
                <a
                  href={`${window.location.origin}/classroom/${cls._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-all"
                  onClick={e => e.stopPropagation()}
                >
                  {`${window.location.origin}/classroom/${cls._id}`}
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-gray-500">No classes found.</div>
        )}
      </div>
    </div>
  );
};

export default ClassesPage;